import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

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

      for (const item of items) {
        const { bookId, quantity, price } = item;

        // 验证库存
        const book = db.prepare('SELECT stock, name FROM hust_library_book WHERE id = ?').get(bookId) as any;
        
        if (!book) {
          throw new Error(`图书ID ${bookId} 不存在`);
        }

        if (book.stock < quantity) {
          throw new Error(`图书《${book.name}》库存不足，当前库存：${book.stock}，需求：${quantity}`);
        }

        // 创建订单记录
        const orderResult = db.prepare(`
          INSERT INTO hust_library_ticket (book_id, price, time, quantity, reader_id, description, address, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          bookId, // 图书ID
          price * quantity, // 总价
          currentTime,
          quantity,
          userId,
          `购买《${book.name}》`,
          orderAddress,
          '待出库' // 初始状态
        );

        orderIds.push(orderResult.lastInsertRowid as number);

        // 减少库存
        db.prepare('UPDATE hust_library_book SET stock = stock - ? WHERE id = ?').run(quantity, bookId);
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

      return NextResponse.json({
        success: true,
        message: '订单创建成功',
        orderIds,
        remainingBalance: user.balance - totalAmount,
        discountApplied: actualDiscountRate,
        originalAmount: originalAmount || totalAmount / (1 - actualDiscountRate)
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
