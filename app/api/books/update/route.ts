import { NextResponse } from 'next/server';
import { updateBook } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { id, name, author, price, publisher, supplier, stock, keyword, seriesNo } = await request.json();
    
    // 验证库存不能为负数
    if (stock !== undefined && stock < 0) {
      return NextResponse.json(
        { success: false, message: '库存数量不能低于0' },
        { status: 400 }
      );
    }
    
    // 更新图书信息
    const result = updateBook(id, name, author, price, publisher, supplier, stock, keyword, seriesNo);
    
    if (result.changes > 0) {
      return NextResponse.json({ success: true, message: '图书信息更新成功' });
    } else {
      return NextResponse.json({ success: false, message: '未找到指定的图书' }, { status: 404 });
    }
  } catch (error) {
    console.error('更新图书信息时出错:', error);
    return NextResponse.json({ success: false, message: '更新图书信息失败' }, { status: 500 });
  }
}