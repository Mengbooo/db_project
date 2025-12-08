import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少订单ID' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    try {
      // 首先检查订单状态
      const order = db.prepare(
        'SELECT * FROM hust_library_ticket WHERE id = ?'
      ).get(id) as any;

      if (!order) {
        db.close();
        return NextResponse.json(
          { success: false, message: '订单不存在' },
          { status: 404 }
        );
      }

      // 只允许删除"已送达"和"已取消"状态的订单
      if (order.status !== '已送达' && order.status !== '已取消') {
        db.close();
        return NextResponse.json(
          { success: false, message: `无法删除状态为"${order.status}"的订单，只能删除"已送达"或"已取消"的订单` },
          { status: 403 }
        );
      }

      // 检查订单是否关联已完成的采购单
      if (order.purchase_id) {
        const linkedPurchase = db.prepare(
          'SELECT status FROM hust_library_purchase WHERE id = ?'
        ).get(order.purchase_id) as any;

        if (linkedPurchase && linkedPurchase.status === '已完成') {
          db.close();
          return NextResponse.json(
            { success: false, message: '该订单关联已完成的采购单，无法删除。请先删除对应的采购单。' },
            { status: 403 }
          );
        }
      }

      // 开始事务
      db.prepare('BEGIN').run();

      try {
        // 如果订单关联了采购单，需要清除采购单的ticket_id关联
        if (order.purchase_id) {
          db.prepare(`
            UPDATE hust_library_purchase 
            SET ticket_id = NULL 
            WHERE id = ?
          `).run(order.purchase_id);
        }

        // 删除订单
        const result = db.prepare(
          'DELETE FROM hust_library_ticket WHERE id = ?'
        ).run(id);

        // 提交事务
        db.prepare('COMMIT').run();
        db.close();

        if (result.changes === 0) {
          return NextResponse.json(
            { success: false, message: '订单不存在或已被删除' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '订单删除成功'
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
    console.error('删除订单失败:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '删除订单失败' },
      { status: 500 }
    );
  }
}
