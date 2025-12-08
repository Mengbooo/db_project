import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, quantity, status } = body;

    // 验证必填字段
    if (!id || !status) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    try {
      // 首先获取现有的采购单信息
      const currentOrder: any = db.prepare('SELECT * FROM hust_library_purchase WHERE id = ?').get(id);
      
      if (!currentOrder) {
        db.close();
        return NextResponse.json(
          { success: false, message: '采购单不存在' },
          { status: 404 }
        );
      }
      
      // 开始事务
      db.prepare('BEGIN').run();
      
      try {
        // 构建UPDATE语句，如果quantity为-1则不更新quantity
        let updateQuery = '';
        let params: any[] = [];
        
        if (quantity !== undefined && quantity !== -1) {
          // 更新quantity和status
          updateQuery = `
            UPDATE hust_library_purchase 
            SET quantity = ?, status = ?
            WHERE id = ?
          `;
          params = [quantity, status, id];
        } else {
          // 只更新status
          updateQuery = `
            UPDATE hust_library_purchase 
            SET status = ?
            WHERE id = ?
          `;
          params = [status, id];
        }
        
        const result = db.prepare(updateQuery).run(...params);

        // 如果状态改为已完成，且之前不是已完成状态，则增加图书数量
        if (status === '已完成' && currentOrder.status !== '已完成') {
          const purchaseQuantity = quantity !== undefined && quantity !== -1 ? quantity : currentOrder.quantity;
          db.prepare(`
            UPDATE hust_library_book 
            SET stock = stock + ?
            WHERE id = ?
          `).run(purchaseQuantity, currentOrder.book_id);
          
          // 如果该采购单关联了订单（ticket_id不为空），则更新订单状态为"待出库"并扣减库存
          if (currentOrder.ticket_id) {
            // 获取关联的订单信息
            const linkedOrder: any = db.prepare('SELECT * FROM hust_library_ticket WHERE id = ?').get(currentOrder.ticket_id);
            
            if (linkedOrder && linkedOrder.status === '待补货') {
              // 更新订单状态为"待出库"
              db.prepare('UPDATE hust_library_ticket SET status = ? WHERE id = ?').run('待出库', currentOrder.ticket_id);
              
              // 扣减订单数量的库存（因为待补货订单创建时没有扣库存）
              db.prepare('UPDATE hust_library_book SET stock = stock - ? WHERE id = ?').run(linkedOrder.quantity, linkedOrder.book_id);
            }
          }
        }
        
        // 如果采购单被取消，且关联了订单，则取消关联订单
        if (status === '已取消' && currentOrder.status !== '已取消' && currentOrder.ticket_id) {
          // 检查关联订单状态
          const linkedOrder: any = db.prepare('SELECT * FROM hust_library_ticket WHERE id = ?').get(currentOrder.ticket_id);
          
          if (linkedOrder && linkedOrder.status === '待补货') {
            // 采购单取消，订单也取消
            db.prepare('UPDATE hust_library_ticket SET status = ? WHERE id = ?').run('已取消', currentOrder.ticket_id);
            
            // 需要退款给用户（待补货订单已经扣款了）
            db.prepare(`
              UPDATE hust_library_user_profile 
              SET balance = balance + ?
              WHERE auth_id = ?
            `).run(linkedOrder.price, linkedOrder.reader_id);
          }
        }

        // 提交事务
        db.prepare('COMMIT').run();
        db.close();

        if (result.changes === 0) {
          return NextResponse.json(
            { success: false, message: '采购单不存在' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '采购单已更新'
        });
      } catch (innerError) {
        // 回滚事务
        db.prepare('ROLLBACK').run();
        throw innerError;
      }
    } catch (dbError) {
      db.close();
      throw dbError;
    }
  } catch (error) {
    console.error('更新采购单失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新采购单失败' },
      { status: 500 }
    );
  }
}
