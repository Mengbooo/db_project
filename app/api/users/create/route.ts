import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { 
      full_name, 
      username, 
      email, 
      phone, 
      address, 
      creditLevel,
      balance,
      password
    } = await request.json();

    // 验证必需字段
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: '用户名、邮箱和密码是必需的' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 开始事务
    db.prepare('BEGIN').run();
    
    try {
      // 检查用户名是否已存在
      const existingUser = db.prepare(
        'SELECT id FROM hust_library_user_auth WHERE username = ?'
      ).get(username);
      
      if (existingUser) {
        // 回滚事务
        db.prepare('ROLLBACK').run();
        db.close();
        
        return NextResponse.json(
          { success: false, message: '用户名已存在' },
          { status: 409 }
        );
      }
      
      // 检查邮箱是否已存在
      const existingEmail = db.prepare(
        'SELECT id FROM hust_library_user_auth WHERE email = ?'
      ).get(email);
      
      if (existingEmail) {
        // 回滚事务
        db.prepare('ROLLBACK').run();
        db.close();
        
        return NextResponse.json(
          { success: false, message: '邮箱已被注册' },
          { status: 409 }
        );
      }
      
      // 插入用户认证信息
      const userResult = db.prepare(
        'INSERT INTO hust_library_user_auth (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
      ).run(username, email, password, 'user'); // 默认为普通用户
      
      const userId = userResult.lastInsertRowid as number;
      
      // 插入用户个人资料（包含原读者信息）
      db.prepare(
        'INSERT INTO hust_library_user_profile (auth_id, full_name, phone, address, balance, creditLevel) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(userId, full_name || username, phone || null, address || null, balance || 0, creditLevel || 1);
      
      // 提交事务
      db.prepare('COMMIT').run();
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: '用户创建成功',
        userId: userId
      });
    } catch (error) {
      // 回滚事务
      db.prepare('ROLLBACK').run();
      db.close();
      throw error;
    }
  } catch (error) {
    console.error('创建用户时出错:', error);
    return NextResponse.json(
      { success: false, message: '创建用户时发生错误: ' + (error as Error).message },
      { status: 500 }
    );
  }
}