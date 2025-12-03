import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    // 验证参数
    if (!id) {
      return NextResponse.json({ success: false, message: '无效的图书ID' }, { status: 400 });
    }
    
    // 获取数据库连接
    const db = getDatabase();
    
    // 开始事务
    db.prepare('BEGIN').run();
    
    try {
      // 删除相关的作者信息
      db.prepare('DELETE FROM hust_library_write WHERE book_id = ?').run(id);
      
      // 删除图书
      const result = db.prepare('DELETE FROM hust_library_book WHERE id = ?').run(id);
      
      // 提交事务
      db.prepare('COMMIT').run();
      
      db.close();
      
      if (result.changes > 0) {
        return NextResponse.json({ success: true, message: '图书已成功删除' });
      } else {
        return NextResponse.json({ success: false, message: '未找到指定的图书' }, { status: 404 });
      }
    } catch (error) {
      // 回滚事务
      db.prepare('ROLLBACK').run();
      db.close();
      throw error;
    }
  } catch (error) {
    console.error('删除图书时出错:', error);
    return NextResponse.json({ success: false, message: '删除图书时发生错误' }, { status: 500 });
  }
}