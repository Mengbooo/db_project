import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/db';

export async function PUT(request: Request) {
  try {
    const { orderId } = await request.json();

    // 验证必需字段
    if (!orderId) {
      return NextResponse.json(
        { error: '订单ID是必需的' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    try {
      // 先查询订单当前完整信息
      const order = db.prepare(`
        SELECT * 
        FROM hust_library_ticket 
        WHERE id = ?
      `).get(orderId) as any;

      if (!order) {
        db.close();
        return NextResponse.json(
          { error: '订单不存在' },
          { status: 404 }
        );
      }

      // 检查订单状态是否允许取消
      // 只有"待补货"和"待出库"状态可以取消，"派送中"和"已完成"不能取消
      const orderStatus = order.status;
      
      if (orderStatus === '派送中' || orderStatus === '已完成') {
        db.close();
        return NextResponse.json(
          { error: `订单状态为"${orderStatus}"，无法取消` },
          { status: 400 }
        );
      }

      if (orderStatus === '已取消') {
        db.close();
        return NextResponse.json(
          { error: '订单已经是取消状态' },
          { status: 400 }
        );
      }

      // 开始事务
      db.prepare('BEGIN').run();

      try {
        // 更新订单状态为"已取消"
        db.prepare(`
          UPDATE hust_library_ticket 
          SET status = '已取消' 
          WHERE id = ?
        `).run(orderId);

        // 如果订单关联了采购单，则取消采购单
        if (order.purchase_id) {
          const linkedPurchase: any = db.prepare('SELECT * FROM hust_library_purchase WHERE id = ?').get(order.purchase_id);
          
          if (linkedPurchase && linkedPurchase.status === '待处理') {
            // 取消采购单
            db.prepare('UPDATE hust_library_purchase SET status = ? WHERE id = ?').run('已取消', order.purchase_id);
          }
        }

        // 根据订单状态进行相应的退款和库存恢复
        if (orderStatus === '待补货') {
          // 待补货订单：只需退款，库存本来就没减
          db.prepare(`
            UPDATE hust_library_user_profile 
            SET balance = balance + ?
            WHERE auth_id = ?
          `).run(order.price, order.reader_id);
        } else if (orderStatus === '待出库') {
          // 待出库订单：需要恢复库存并退款
          // 恢复库存
          db.prepare('UPDATE hust_library_book SET stock = stock + ? WHERE id = ?').run(order.quantity, order.book_id);
          // 退款
          db.prepare(`
            UPDATE hust_library_user_profile 
            SET balance = balance + ?
            WHERE auth_id = ?
          `).run(order.price, order.reader_id);
        }

        // 提交事务
        db.prepare('COMMIT').run();
        db.close();
      } catch (innerError) {
        db.prepare('ROLLBACK').run();
        throw innerError;
      }
      
      return NextResponse.json({ 
        success: true, 
        message: '订单已取消，已为您退款' 
      });
    } catch (error) {
      db.close();
      throw error;
    }
  } catch (error) {
    console.error('取消订单时出错:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '取消订单时发生错误',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
