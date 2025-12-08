import { NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserByUsername } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

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
    const { username, email, password } = await request.json();

    // 验证输入
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '用户名、邮箱和密码都是必填项' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUserByUsername = getUserByUsername(username) as User | undefined;
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      );
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = getUserByEmail(email) as User | undefined;
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: '邮箱已被注册' },
        { status: 409 }
      );
    }

    // 创建用户（默认为普通用户）
    const result = createUser(username, email, password, 'user');

    // 发送欢迎邮件（异步，不阻塞注册流程）
    sendWelcomeEmail(email, username).catch(error => {
      console.error('发送欢迎邮件失败:', error);
      // 不阻塞注册流程，只记录错误
    });

    return NextResponse.json(
      { 
        message: '用户注册成功',
        userId: result.lastInsertRowid
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}