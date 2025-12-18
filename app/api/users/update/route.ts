import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/db';

export async function PUT(request: Request) {
  try {
    const { 
      id, 
      creditLevel,
      balance
    } = await request.json();

    // 验证必需字段
    if (!id) {
      return NextResponse.json(
        { error: '用户ID是必需的' },
        { status: 400 }
      );
    }

    // 管理员只能修改会员等级和余额
    if (creditLevel === undefined && balance === undefined) {
      return NextResponse.json(
        { error: '至少需要提供会员等级或余额中的一个进行更新' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 开始事务
    db.prepare('BEGIN').run();
    
    try {
      // 只更新用户个人资料中的信用等级和余额
      const profileUpdate: any[] = [];
      const profileValues: any[] = [];
      
      if (creditLevel !== undefined) {
        profileUpdate.push('creditLevel = ?');
        profileValues.push(creditLevel);
      }
      
      if (balance !== undefined) {
        profileUpdate.push('balance = ?');
        profileValues.push(balance);
      }
      
      // 执行更新
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