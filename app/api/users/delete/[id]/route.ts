import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../../lib/db';

// 修复参数处理方式，使用params对象而不是request.params
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 解包Promise参数
    const unwrappedParams = await params;
    const userId = parseInt(unwrappedParams.id);
    
    // 验证用户ID
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: '无效的用户ID' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    
    // 开始事务
    db.prepare('BEGIN').run();
    
    try {
      // 删除用户相关的所有数据
      // 注意：由于设置了外键约束，删除用户认证信息时会级联删除个人资料
      
      // 删除用户个人资料
      db.prepare('DELETE FROM hust_library_user_profile WHERE auth_id = ?').run(userId);
      
      // 删除用户认证信息（会级联删除个人资料）
      const result = db.prepare('DELETE FROM hust_library_user_auth WHERE id = ?').run(userId);
      
      // 检查是否删除成功
      if (result.changes === 0) {
        // 回滚事务
        db.prepare('ROLLBACK').run();
        db.close();
        
        return NextResponse.json(
          { success: false, message: '未找到指定的用户' },
          { status: 404 }
        );
      }
      
      // 提交事务
      db.prepare('COMMIT').run();
      db.close();
      
      return NextResponse.json({ 
        success: true, 
        message: '用户删除成功' 
      });
    } catch (error) {
      // 回滚事务
      db.prepare('ROLLBACK').run();
      db.close();
      throw error;
    }
  } catch (error) {
    console.error('删除用户时出错:', error);
    return NextResponse.json(
      { success: false, message: '删除用户时发生错误: ' + (error as Error).message },
      { status: 500 }
    );
  }
}