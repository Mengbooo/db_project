import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { sendSupplierPurchaseNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { book_id, quantity } = body;

    // 验证必填字段
    if (!book_id || !quantity) {
      return NextResponse.json(
        { error: '缺少必填字段：book_id或quantity' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    try {
      // 验证book_id是否存在
      const book: any = db.prepare('SELECT * FROM hust_library_book WHERE id = ?').get(book_id);
      if (!book) {
        db.close();
        return NextResponse.json(
          { success: false, message: '指定的图书不存在' },
          { status: 404 }
        );
      }

      // 前罫取供应商信息
      const supplier: any = db.prepare('SELECT email, name FROM hust_library_supplier WHERE name = ?').get(book.supplier);

      // 创建新采购单
      const result = db.prepare(`
        INSERT INTO hust_library_purchase (book_id, quantity, status)
        VALUES (?, ?, '待处理')
      `).run(book_id, quantity);

      db.close();
      
      const purchaseId = result.lastInsertRowid as number;
      const purchaseOrderId = `PUR-${String(purchaseId).padStart(4, '0')}`;

      // 发送供应商邮件（异步，不阻塞响应）
      if (supplier && supplier.email) {
        sendSupplierPurchaseNotificationEmail(
          supplier.email,
          supplier.name,
          book.name,
          quantity,
          purchaseOrderId
        ).catch(error => {
          console.error('发送采购单邮件失败:', error);
          // 不阻塞响应，只记录错误
        });
      }

      return NextResponse.json({
        success: true,
        message: '采购单已创建',
        id: result.lastInsertRowid
      });
    } catch (dbError) {
      db.close();
      throw dbError;
    }
  } catch (error) {
    console.error('创建采购单失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建采购单失败' },
      { status: 500 }
    );
  }
}
