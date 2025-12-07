import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/db';

export async function PUT(request: Request) {
  try {
    const { 
      id, 
      full_name, 
      username, 
      email, 
      phone, 
      address, 
      creditLevel,
      balance,
      password // 新增密码字段
    } = await request.json();

    // 验证必需字段
    if (!id) {
      return NextResponse.json(
        { error: '用户ID是必需的' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 开始事务
    db.prepare('BEGIN').run();
    
    try {
      // 更新用户认证信息（总是更新，因为至少会更新时间戳）
      const authUpdate: any[] = [];
      const authValues: any[] = [];
      
      if (username !== undefined) {
        authUpdate.push('username = ?');
        authValues.push(username);
      }
      
      if (email !== undefined) {
        authUpdate.push('email = ?');
        authValues.push(email);
      }
      
      // 如果有密码更新
      if (password !== undefined) {
        authUpdate.push('password_hash = ?');
        authValues.push(password); // 学习项目使用明文密码
      }
      
      // 如果有要更新的字段，则执行更新
      if (authUpdate.length > 0) {
        authValues.push(id);
        
        db.prepare(`
          UPDATE hust_library_user_auth 
          SET ${authUpdate.join(', ')} 
          WHERE id = ?
        `).run(...authValues);
      }
      
      // 更新用户个人资料（包含原读者信息）
      const profileUpdate: any[] = [];
      const profileValues: any[] = [];
      
      if (full_name !== undefined) {
        profileUpdate.push('full_name = ?');
        profileValues.push(full_name);
      }
      
      if (phone !== undefined) {
        profileUpdate.push('phone = ?');
        profileValues.push(phone || null);
      }
      
      // 注意：地址、余额和信用等级现在存储在用户个人资料表中
      if (address !== undefined) {
        profileUpdate.push('address = ?');
        profileValues.push(address || null);
      }
      
      if (creditLevel !== undefined) {
        profileUpdate.push('creditLevel = ?');
        profileValues.push(creditLevel);
      }
      
      if (balance !== undefined) {
        profileUpdate.push('balance = ?');
        profileValues.push(balance);
      }
      
      // 如果有要更新的字段，则执行更新
      if (profileUpdate.length > 0) {
        profileValues.push(id);
        
        db.prepare(`
          UPDATE hust_library_user_profile 
          SET ${profileUpdate.join(', ')} 
          WHERE auth_id = ?
        `).run(...profileValues);
      }
      
      // 提交事务
      db.prepare('COMMIT').run();
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: '用户信息更新成功' 
      });
    } catch (error) {
      // 回滚事务
      db.prepare('ROLLBACK').run();
      db.close();
      throw error;
    }
  } catch (error) {
    console.error('更新用户信息时出错:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '更新用户信息时发生错误',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}