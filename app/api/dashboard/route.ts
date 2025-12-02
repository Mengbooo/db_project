import { NextResponse } from 'next/server';
import { 
  getFullUserInfo,
  getAllBooks,
  getUserOrderHistory
} from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 从查询参数中获取用户ID，默认为2（用于测试）
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId') || '2';
    const userId = parseInt(userIdParam);
    
    // 验证用户ID
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // 获取用户信息
    const user = getFullUserInfo(userId);
    
    // 获取所有图书
    const books = getAllBooks();
    
    // 获取用户订单历史
    const orders = getUserOrderHistory(userId);
    
    return NextResponse.json({ 
      user,
      books,
      orders
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data from database' },
      { status: 500 }
    );
  }
}