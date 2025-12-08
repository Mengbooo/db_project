import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '采购单ID缺失' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    try {
      // 删除采购单
      const result = db.prepare('DELETE FROM hust_library_purchase WHERE id = ?').run(id);

      db.close();

      if (result.changes === 0) {
        return NextResponse.json(
          { success: false, message: '采购单不存在' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '采购单已删除'
      });
    } catch (dbError) {
      db.close();
      throw dbError;
    }
  } catch (error) {
    console.error('删除采购单失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除采购单失败' },
      { status: 500 }
    );
  }
}
