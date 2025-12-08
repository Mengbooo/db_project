import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { sendSupplierPurchaseNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, items, totalAmount, originalAmount, discountRate, shippingAddress } = body;

    // 验证必填字段
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '缺少必填字段或购物车为空' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    try {
      // 开始事务
      db.prepare('BEGIN').run();

      // 获取用户信息，验证余额
      const user = db.prepare(`
        SELECT up.balance, up.address, up.creditLevel
        FROM hust_library_user_profile up
        WHERE up.auth_id = ?
      `).get(userId) as any;

      if (!user) {
        throw new Error('用户不存在');
      }

      // 如果没有传入折扣信息，根据用户信用等级计算
      let actualDiscountRate = discountRate;
      if (actualDiscountRate === undefined) {
        switch(user.creditLevel) {
          case 1: actualDiscountRate = 0.10; break;
          case 2: actualDiscountRate = 0.15; break;
          case 3: actualDiscountRate = 0.15; break;
          case 4: actualDiscountRate = 0.20; break;
          case 5: actualDiscountRate = 0.25; break;
          default: actualDiscountRate = 0.10;
        }
      }

      // 使用传入的地址，如果没有则使用用户默认地址
      const orderAddress = shippingAddress || user.address || '未设置';

      // 检查余额是否足够
      if (user.balance < totalAmount) {
        throw new Error('余额不足');
      }

      // 为每个购物车项目创建订单
      const currentTime = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      const orderIds: number[] = [];
      const pendingRestockOrders: { orderId: number; bookId: number; shortageQuantity: number; bookName: string }[] = [];

      for (const item of items) {
        const { bookId, quantity, price } = item;

        // 获取图书信息
        const book = db.prepare('SELECT stock, name FROM hust_library_book WHERE id = ?').get(bookId) as any;
        
        if (!book) {
          throw new Error(`图书ID ${bookId} 不存在`);
        }

        // 判断是否超出库存
        const isOverStock = book.stock < quantity;
        const shortageQuantity = isOverStock ? quantity - book.stock : 0;
        
        // 订单状态：如果超出库存则为"待补货"，否则为"待出库"
        const orderStatus = isOverStock ? '待补货' : '待出库';

        // 创建订单记录
        const orderResult = db.prepare(`
          INSERT INTO hust_library_ticket (book_id, price, time, quantity, reader_id, description, address, status, purchase_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        `).run(
          bookId, // 图书ID
          price * quantity, // 总价
          currentTime,
          quantity,
          userId,
          `购买《${book.name}》`,
          orderAddress,
          orderStatus
        );

        const orderId = orderResult.lastInsertRowid as number;
        orderIds.push(orderId);

        if (isOverStock) {
          // 超出库存，记录待创建的采购单信息
          pendingRestockOrders.push({
            orderId,
            bookId,
            shortageQuantity,
            bookName: book.name
          });
          // 待补货订单不减少库存
        } else {
          // 正常订单，减少库存
          db.prepare('UPDATE hust_library_book SET stock = stock - ? WHERE id = ?').run(quantity, bookId);
        }
      }

      // 为超出库存的订单创建采购单
      const suppliersToNotify: { email: string; name: string; bookTitle: string; quantity: number; purchaseOrderId: string }[] = [];
      
      for (const pending of pendingRestockOrders) {
        // 创建采购单，数量为超出库存的数量
        const purchaseResult = db.prepare(`
          INSERT INTO hust_library_purchase (book_id, quantity, status, ticket_id)
          VALUES (?, ?, '待处理', ?)
        `).run(pending.bookId, pending.shortageQuantity, pending.orderId);

        const purchaseId = purchaseResult.lastInsertRowid as number;

        // 更新订单的purchase_id字段
        db.prepare('UPDATE hust_library_ticket SET purchase_id = ? WHERE id = ?').run(purchaseId, pending.orderId);
        
        // 获取供应商信息以便后续发送邮件
        const supplier: any = db.prepare('SELECT email, name FROM hust_library_supplier WHERE name = (SELECT supplier FROM hust_library_book WHERE id = ?)').get(pending.bookId);
        if (supplier && supplier.email) {
          suppliersToNotify.push({
            email: supplier.email,
            name: supplier.name,
            bookTitle: pending.bookName,
            quantity: pending.shortageQuantity,
            purchaseOrderId: `PUR-${String(purchaseId).padStart(4, '0')}`
          });
        }
      }

      // 扣除用户余额
      db.prepare(`
        UPDATE hust_library_user_profile 
        SET balance = balance - ? 
        WHERE auth_id = ?
      `).run(totalAmount, userId);

      // 提交事务
      db.prepare('COMMIT').run();

      db.close();
      
      // 发送供应商采购单邮件（异步，不阻塞响应）
      for (const supplier of suppliersToNotify) {
        sendSupplierPurchaseNotificationEmail(
          supplier.email,
          supplier.name,
          supplier.bookTitle,
          supplier.quantity,
          supplier.purchaseOrderId
        ).catch(error => {
          console.error('发送采购单邮件失败:', error);
          // 不阻塞响应，只记录错误
        });
      }

      return NextResponse.json({
        success: true,
        message: pendingRestockOrders.length > 0 
          ? `订单创建成功，其中${pendingRestockOrders.length}个订单需要补货`
          : '订单创建成功',
        orderIds,
        remainingBalance: user.balance - totalAmount,
        discountApplied: actualDiscountRate,
        originalAmount: originalAmount || totalAmount / (1 - actualDiscountRate),
        pendingRestockCount: pendingRestockOrders.length
      });

    } catch (error) {
      // 回滚事务
      db.prepare('ROLLBACK').run();
      db.close();
      throw error;
    }

  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建订单失败' },
      { status: 500 }
    );
  }
}
