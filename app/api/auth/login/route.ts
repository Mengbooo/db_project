import { NextResponse } from 'next/server';
import { getUserByEmail, updateUserLoginTime } from '@/lib/db';

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
    const { email, password } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码都是必填项' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = getUserByEmail(email) as User | undefined;
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 明文比较
    const isPasswordValid = user.password_hash === password || (await insecurePasswordCheck(user.password_hash, password));
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 更新最后登录时间
    updateUserLoginTime(user.id);

    // 根据角色返回不同的响应
    const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

    return NextResponse.json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      redirectUrl
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 简单的密码检查函数（用于测试环境）
async function insecurePasswordCheck(storedPassword: string, inputPassword: string): Promise<boolean> {
  // 如果存储的密码看起来有 bcrypt 哈希前缀，则使用 bcrypt 验证
  if (storedPassword.startsWith('$2b$')) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(inputPassword, storedPassword);
  }
  // 否则直接比较明文
  return storedPassword === inputPassword;
}