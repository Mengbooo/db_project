import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    // 验证必填字段
    if (!orderId || !status) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 仏orderId中提取数字ID (例如: "ORD-0001" -> 1)
    const id = parseInt(orderId.replace('ORD-', ''));

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的订单ID' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    try {
      // 首先获取当前订单信息
      const currentOrder: any = db.prepare('SELECT * FROM hust_library_ticket WHERE id = ?').get(id);
      
      if (!currentOrder) {
        db.close();
        return NextResponse.json(
          { success: false, message: '订单不存在' },
          { status: 404 }
        );
      }
      
      // 开始事务
      db.prepare('BEGIN').run();
      
      try {
        // 更新订单状态
        const result = db.prepare(
          'UPDATE hust_library_ticket SET status = ? WHERE id = ?'
        ).run(status, id);

        // 如果订单被取消，且关联了采购单，则级联取消采购单
        if (status === '已取消' && currentOrder.status !== '已取消') {
          // 如果订单关联了采购单（待补货订单）
          if (currentOrder.purchase_id) {
            // 获取关联的采购单
            const linkedPurchase: any = db.prepare('SELECT * FROM hust_library_purchase WHERE id = ?').get(currentOrder.purchase_id);
            
            if (linkedPurchase && linkedPurchase.status === '待处理') {
              // 取消采购单
              db.prepare('UPDATE hust_library_purchase SET status = ? WHERE id = ?').run('已取消', currentOrder.purchase_id);
            }
          }
          
          // 退款给用户（待补货订单已经扣款了）
          if (currentOrder.status === '待补货') {
            db.prepare(`
              UPDATE hust_library_user_profile 
              SET balance = balance + ?
              WHERE auth_id = ?
            `).run(currentOrder.price, currentOrder.reader_id);
          }
          
          // 如果是正常订单（已扣库存），需要恢复库存
          if (currentOrder.status === '待出库' || currentOrder.status === '已发货') {
            db.prepare('UPDATE hust_library_book SET stock = stock + ? WHERE id = ?').run(currentOrder.quantity, currentOrder.book_id);
            // 退款给用户
            db.prepare(`
              UPDATE hust_library_user_profile 
              SET balance = balance + ?
              WHERE auth_id = ?
            `).run(currentOrder.price, currentOrder.reader_id);
          }
        }

        // 提交事务
        db.prepare('COMMIT').run();
        db.close();

        if (result.changes === 0) {
          return NextResponse.json(
            { success: false, message: '订单不存在或未发生更改' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '订单状态更新成功'
        });
      } catch (innerError) {
        // 回滚事务
        db.prepare('ROLLBACK').run();
        throw innerError;
      }

    } catch (error) {
      db.close();
      throw error;
    }

  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '更新订单失败' },
      { status: 500 }
    );
  }
}
