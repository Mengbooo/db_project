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
    
    // 获取采购单数据（含有书名、供应商、供应商邮箱、关联的订单ID）
    const dbForPurchase = getDatabase();
    const purchaseOrders: any[] = dbForPurchase.prepare(`
      SELECT 
        p.id,
        p.book_id,
        p.quantity,
        p.status,
        p.ticket_id,
        b.name as book_name,
        b.supplier as supplier_name,
        s.email as supplier_email
      FROM hust_library_purchase p
      LEFT JOIN hust_library_book b ON p.book_id = b.id
      LEFT JOIN hust_library_supplier s ON b.supplier = s.name
    `).all();
    dbForPurchase.close();
    
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
          supplier: book.supplier,
          seriesNo: book.seriesNo || 0,
          publishDate: book.time ? (() => {
            // 将YYYYMMDD格式的数字转换为日期字符串
            const dateStr = book.time.toString();
            if (dateStr.length === 8) {
              const year = dateStr.substring(0, 4);
              const month = dateStr.substring(4, 6);
              const day = dateStr.substring(6, 8);
              return `${year}-${month}-${day}`;
            }
            return '未知日期';
          })() : '未知日期', // 将YYYYMMDD格式转换为YYYY-MM-DD格式
        };
      }),
      orders: tickets.map((ticket: any) => {
        // 查找对应的图书信息
        const book = books.find((b: any) => b.id === ticket.book_id);
        // 查找对应的用户信息（使用user_profile中的名字和地址）
        const user: any = usersWithProfiles.find((u: any) => u.id === ticket.reader_id);
        const customerName = user ? (user.full_name || user.username) : `用户${ticket.reader_id}`;
        const shippingAddress = user ? (user.address || '未设置') : '未设置';
        
        return {
          id: `ORD-${ticket.id.toString().padStart(4, '0')}`,
          customer: customerName,
          date: new Date(ticket.time * 1000).toISOString().split('T')[0], // 将时间戳转换为日期
          total: ticket.price,
          items: ticket.quantity,
          status: ticket.status || 'Pending',
          shippingAddress: shippingAddress, // 使用user_profile中的地址
          bookTitle: book ? book.name : '未知图书' // 添加书名
        };
      }),
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
      })),
      purchaseOrders: purchaseOrders.map((purchase: any) => ({
        id: purchase.id.toString(),
        bookId: purchase.book_id,
        bookTitle: purchase.book_name || '未知图书',
        supplier: purchase.supplier_name || '未设置',
        supplierEmail: purchase.supplier_email || '未设置',
        quantity: purchase.quantity,
        status: purchase.status || '待处理',
        linkedOrderId: purchase.ticket_id ? `ORD-${purchase.ticket_id.toString().padStart(4, '0')}` : null // 关联的订单ID
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