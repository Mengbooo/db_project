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
      // 先查询订单当前状态
      const order = db.prepare(`
        SELECT id, status 
        FROM hust_library_ticket 
        WHERE id = ?
      `).get(orderId);

      if (!order) {
        db.close();
        return NextResponse.json(
          { error: '订单不存在' },
          { status: 404 }
        );
      }

      // 检查订单状态是否允许取消
      // 只有“待出库”状态可以取消，“派送中”和“已完成”不能取消
      const orderStatus = (order as any).status;
      
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

      // 更新订单状态为"已取消"
      db.prepare(`
        UPDATE hust_library_ticket 
        SET status = '已取消' 
        WHERE id = ?
      `).run(orderId);

      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: '订单已取消' 
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
