import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id, quantity } = await request.json();
    
    // 验证参数
    if (!id || !quantity) {
      return NextResponse.json({ success: false, message: '缺少必要参数' }, { status: 400 });
    }
    
    if (quantity <= 0) {
      return NextResponse.json({ success: false, message: '补货数量必须大于0' }, { status: 400 });
    }
    
    // 获取数据库连接
    const db = getDatabase();
    
    // 检查图书是否存在
    const book: any = db.prepare('SELECT * FROM hust_library_book WHERE id = ?').get(id);
    
    if (!book) {
      db.close();
      return NextResponse.json({ success: false, message: '未找到指定的图书' }, { status: 404 });
    }
    
    // 更新图书库存
    const newStock = book.stock + quantity;
    const result = db.prepare(
      'UPDATE hust_library_book SET stock = ? WHERE id = ?'
    ).run(newStock, id);
    
    db.close();
    
    if (result.changes > 0) {
      return NextResponse.json({ success: true, message: `图书库存已更新，新增${quantity}本` });
    } else {
      return NextResponse.json({ success: false, message: '更新库存失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('补货时出错:', error);
    return NextResponse.json({ success: false, message: '补货时发生错误' }, { status: 500 });
  }
}