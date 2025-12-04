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

    // 从orderId中提取数字ID (例如: "ORD-0001" -> 1)
    const id = parseInt(orderId.replace('ORD-', ''));

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的订单ID' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    try {
      // 更新订单状态
      const result = db.prepare(
        'UPDATE hust_library_ticket SET status = ? WHERE id = ?'
      ).run(status, id);

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
