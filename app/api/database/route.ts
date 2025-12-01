import { NextResponse } from 'next/server';
import { getDatabase, getUsers as dbGetUsers, getPosts as dbGetPosts } from '@/lib/db';

export async function GET() {
  try {
    // 测试数据库连接
    const db = getDatabase();
    db.close();
    
    // 获取用户和文章数据
    const users = dbGetUsers();
    const posts = dbGetPosts();
    
    return NextResponse.json({ users, posts });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from database' },
      { status: 500 }
    );
  }
}