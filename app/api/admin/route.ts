import { NextResponse } from 'next/server';
import { 
  getDatabase,
  getBooksWithAuthors,
  getTickets,
  getSuppliers,
  getFullUserInfo,
  getBookStatusView
} from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    
    // 测试数据库连接
    const db = getDatabase();
    db.close();
    
    // 获取网上书店系统的数据
    const books: any[] = getBooksWithAuthors();
    const tickets: any[] = getTickets();
    const suppliers: any[] = getSuppliers();
    
    // 获取图书状态视图
    const bookStatusView: any[] = getBookStatusView();
    
    // 获取所有用户的完整信息（从user_auth和user_profile表）
    const dbInstance = getDatabase();
    const usersWithProfiles = dbInstance.prepare(`
      SELECT 
        ua.id,
        ua.username,
        ua.email,
        ua.role,
        ua.created_at,
        up.full_name,
        up.phone,
        up.address,
        up.balance,
        up.creditLevel,
        up.avatar_url
      FROM hust_library_user_auth ua
      LEFT JOIN hust_library_user_profile up ON ua.id = up.auth_id
      ORDER BY ua.id
    `).all();
    dbInstance.close();
    
    // 如果提供了adminId，获取特定admin的信息
    let adminInfo = null;
    if (adminId) {
      const adminData: any = getFullUserInfo(parseInt(adminId));
      if (adminData) {
        adminInfo = {
          id: adminData.id,
          username: adminData.username,
          email: adminData.email,
          full_name: adminData.full_name || adminData.username,
          phone: adminData.phone || '未设置',
          profile_address: adminData.profile_address || '未设置',
          balance: adminData.balance || 0,
          creditLevel: adminData.creditLevel || 1,
          avatar_url: adminData.avatar_url || null,
          role: adminData.role || 'admin'
        };
      }
    }
    
    return NextResponse.json({ 
      admin: adminInfo,
      books: books.map(book => {
        // 从视图中获取图书状态
        const bookStatus = bookStatusView.find((b: any) => b.id === book.id);
        const status = bookStatus ? bookStatus.status : 'In Stock';
        
        return {
          id: book.id,
          title: book.name,
          author: book.authors || '未知作者',
          price: book.price,
          stock: book.stock,
          category: book.keyword || '未分类',
          status: status,
          publisher: book.publish,
          publishDate: new Date(book.time * 1000).toISOString().split('T')[0], // 将时间戳转换为日期
        };
      }),
      orders: tickets.map(ticket => ({
        id: `ORD-${ticket.id.toString().padStart(4, '0')}`,
        customer: `用户${ticket.reader_id}`,
        date: new Date(ticket.time * 1000).toISOString().split('T')[0], // 将时间戳转换为日期
        total: ticket.price,
        items: ticket.quantity,
        status: ticket.status || 'Pending',
        shippingAddress: ticket.address || '未设置'
      })),
      users: usersWithProfiles.map((user: any) => ({
        id: user.id,
        full_name: user.full_name || user.username,
        username: user.username,
        email: user.email,
        creditLevel: user.creditLevel || 1,
        joined: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '未知',
        status: user.role === 'admin' ? 'Active' : 'Active', // 默认都是Active
        phone: user.phone || '未设置',
        profile_address: user.address || '未设置',
        balance: user.balance || 0,
        role: user.role || 'user'
      })),
      suppliers: suppliers.map(supplier => ({
        id: `SUP-${supplier.id.toString().padStart(2, '0')}`,
        name: supplier.name,
        email: supplier.email || '未设置邮箱',
        category: supplier.category || '未分类',
        region: supplier.region || '中国',
        phone: supplier.phone || '未设置电话',
        website: supplier.website || '未设置网站',
      }))
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard data from database' },
      { status: 500 }
    );
  }
}