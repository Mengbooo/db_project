import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// 定义用户类型
interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  last_login: string | null;
  is_active: number;
}

export async function POST(request: Request) {
  try {
    const { userId, newRole, adminId } = await request.json();

    // 验证输入
    if (!userId || !newRole || !adminId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证新角色是否有效
    if (newRole !== 'user' && newRole !== 'admin') {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 验证管理员身份
    const admin = db.prepare('SELECT * FROM hust_library_user_auth WHERE id = ? AND role = ?').get(adminId, 'admin') as User | undefined;
    if (!admin) {
      db.close();
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    // 检查目标用户是否存在
    const targetUser = db.prepare('SELECT * FROM hust_library_user_auth WHERE id = ?').get(userId) as User | undefined;
    if (!targetUser) {
      db.close();
      return NextResponse.json(
        { error: '目标用户不存在' },
        { status: 404 }
      );
    }

    // 不能更改自己的角色
    if (userId === adminId) {
      db.close();
      return NextResponse.json(
        { error: '不能更改自己的角色' },
        { status: 400 }
      );
    }

    // 更新用户角色
    const result = db.prepare(
      'UPDATE hust_library_user_auth SET role = ? WHERE id = ?'
    ).run(newRole, userId);

    db.close();

    return NextResponse.json({
      message: '角色更新成功',
      updatedRows: result.changes
    });

  } catch (error) {
    console.error('Set role error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}