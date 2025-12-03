import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 验证ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: '供应商ID为必填项' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 检查供应商是否存在
    const existingSupplier = db.prepare('SELECT id FROM hust_library_supplier WHERE id = ?').get(id);
    if (!existingSupplier) {
      db.close();
      return NextResponse.json(
        { success: false, message: '供应商不存在' },
        { status: 404 }
      );
    }

    // 删除供应商
    const result = db.prepare('DELETE FROM hust_library_supplier WHERE id = ?').run(id);

    db.close();

    return NextResponse.json({
      success: true,
      message: '供应商删除成功'
    });
  } catch (error) {
    console.error('删除供应商时出错:', error);
    return NextResponse.json(
      { success: false, message: '删除供应商失败' },
      { status: 500 }
    );
  }
}
