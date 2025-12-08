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
      }

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
