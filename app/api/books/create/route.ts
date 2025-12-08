import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, author, price, publisher, supplier, stock, keyword, seriesNo } = await request.json();
    
    // 验证参数
    if (!name || !price || !publisher || !supplier || stock === undefined || !keyword) {
      return NextResponse.json({ success: false, message: '缺少必要参数' }, { status: 400 });
    }
    
    // 验证库存不能为负数
    if (stock < 0) {
      return NextResponse.json(
        { success: false, message: '库存数量不能低于0' },
        { status: 400 }
      );
    }
    
    // 获取数据库连接
    const db = getDatabase();
    
    // 开始事务
    db.prepare('BEGIN').run();
    
    try {
      // 插入新图书
      const bookResult = db.prepare(
        'INSERT INTO hust_library_book (name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(name, Math.floor(Date.now() / 1000), price, publisher, keyword, stock, supplier, seriesNo || 0);
      
      // 如果提供了作者信息，则插入作者信息
      if (author && bookResult.lastInsertRowid) {
        // 如果作者是逗号分隔的多个作者，需要分别插入（支持中文逗号和英文逗号）
        const authors = (author as string).split(/[,，]/).map((a: string) => a.trim()).filter((a: string) => a);
        
        // 限制最多4个作者
        if (authors.length > 4) {
          db.prepare('ROLLBACK').run();
          db.close();
          return NextResponse.json({ success: false, message: '每本图书最多只能有4个作者，请用逗号分隔' }, { status: 400 });
        }
        
        for (const writer of authors) {
          db.prepare(
            'INSERT INTO hust_library_write (book_id, writer) VALUES (?, ?)'
          ).run(bookResult.lastInsertRowid, writer);
        }
      }
      
      // 提交事务
      db.prepare('COMMIT').run();
      
      db.close();
      
      if (bookResult.lastInsertRowid) {
        return NextResponse.json({ success: true, message: '图书已成功添加', id: bookResult.lastInsertRowid });
      } else {
        return NextResponse.json({ success: false, message: '添加图书失败' }, { status: 500 });
      }
    } catch (error) {
      // 回滚事务
      db.prepare('ROLLBACK').run();
      db.close();
      throw error;
    }
  } catch (error) {
    console.error('添加图书时出错:', error);
    return NextResponse.json({ success: false, message: '添加图书时发生错误' }, { status: 500 });
  }
}