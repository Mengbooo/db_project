import Database from 'better-sqlite3';
import path from 'path';

// 获取数据库实例
export const getDatabase = () => {
  const dbPath = path.join(process.cwd(), 'db', 'database.db');
  return new Database(dbPath);
};

// 图书相关操作
export const getBooks = () => {
  const db = getDatabase();
  const books = db.prepare('SELECT * FROM hust_library_book').all();
  db.close();
  return books;
};

export const getBookById = (id: number) => {
  const db = getDatabase();
  const book = db.prepare('SELECT * FROM hust_library_book WHERE id = ?').get(id);
  db.close();
  return book;
};

export const getBooksWithAuthors = () => {
  const db = getDatabase();
  const books = db.prepare(`
    SELECT b.*, GROUP_CONCAT(w.writer, ', ') as authors
    FROM hust_library_book b
    LEFT JOIN hust_library_write w ON b.id = w.book_id
    GROUP BY b.id
  `).all();
  db.close();
  return books;
};

// 读者相关操作
export const getReaders = () => {
  const db = getDatabase();
  const readers = db.prepare('SELECT * FROM hust_library_reader').all();
  db.close();
  return readers;
};

export const getReaderById = (id: number) => {
  const db = getDatabase();
  const reader = db.prepare('SELECT * FROM hust_library_reader WHERE id = ?').get(id);
  db.close();
  return reader;
};

// 订单相关操作
export const getTickets = () => {
  const db = getDatabase();
  const tickets = db.prepare('SELECT * FROM hust_library_ticket').all();
  db.close();
  return tickets;
};

export const getTicketById = (id: number) => {
  const db = getDatabase();
  const ticket = db.prepare('SELECT * FROM hust_library_ticket WHERE id = ?').get(id);
  db.close();
  return ticket;
};

// 供应商相关操作
export const getSuppliers = () => {
  const db = getDatabase();
  const suppliers = db.prepare('SELECT * FROM hust_library_supplier').all();
  db.close();
  return suppliers;
};

// 库存相关操作
export const getStores = () => {
  const db = getDatabase();
  const stores = db.prepare('SELECT * FROM hust_library_store').all();
  db.close();
  return stores;
};

// 采购单相关操作
export const getPurchases = () => {
  const db = getDatabase();
  const purchases = db.prepare('SELECT * FROM hust_library_purchase').all();
  db.close();
  return purchases;
};

// 缺书登记相关操作
export const getBookShortages = () => {
  const db = getDatabase();
  const shortages = db.prepare('SELECT * FROM hust_library_bookShortage').all();
  db.close();
  return shortages;
};

// 用户认证相关操作
export const getUserByEmail = (email: string) => {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM hust_library_user_auth WHERE email = ?').get(email);
  db.close();
  return user;
};

export const getUserByUsername = (username: string) => {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM hust_library_user_auth WHERE username = ?').get(username);
  db.close();
  return user;
};

export const createUser = (username: string, email: string, password: string, role: string = 'user') => {
  const db = getDatabase();
  const result = db.prepare(
    'INSERT INTO hust_library_user_auth (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(username, email, password, role);
  
  // 同时创建用户个人信息记录
  db.prepare(
    'INSERT INTO hust_library_user_profile (auth_id, full_name) VALUES (?, ?)'
  ).run(result.lastInsertRowid, username);
  
  // 同时创建读者记录
  db.prepare(
    'INSERT INTO hust_library_reader (id, userId, address, balance, creditLevel) VALUES (?, ?, ?, ?, ?)'
  ).run(result.lastInsertRowid, username, '', 0.00, 1);
  
  db.close();
  return result;
};

export const updateUserLoginTime = (userId: number) => {
  const db = getDatabase();
  const result = db.prepare(
    'UPDATE hust_library_user_auth SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(userId);
  db.close();
  return result;
};

export const getUserProfile = (authId: number) => {
  const db = getDatabase();
  const profile = db.prepare(
    'SELECT * FROM hust_library_user_profile WHERE auth_id = ?'
  ).get(authId);
  db.close();
  return profile;
};

export const updateUserProfile = (authId: number, fullName: string, phone?: string, address?: string) => {
  const db = getDatabase();
  const result = db.prepare(
    'UPDATE hust_library_user_profile SET full_name = ?, phone = ?, address = ? WHERE auth_id = ?'
  ).run(fullName, phone || null, address || null, authId);
  db.close();
  return result;
};

// 视图相关操作

// 获取图书详细信息视图
export const getBookDetailView = () => {
  const db = getDatabase();
  const books = db.prepare('SELECT * FROM book_detail_view').all();
  db.close();
  return books;
};

// 获取读者订单历史视图
export const getReaderOrderHistory = () => {
  const db = getDatabase();
  const history = db.prepare('SELECT * FROM reader_order_history').all();
  db.close();
  return history;
};

// 获取完整的用户信息（包括认证信息、个人资料和读者信息）
export const getFullUserInfo = (userId: number) => {
  const db = getDatabase();
  const userInfo = db.prepare(`
    SELECT 
      ua.id,
      ua.username,
      ua.email,
      ua.role,
      up.full_name,
      up.phone,
      up.address as profile_address,
      up.avatar_url,
      r.userId as reader_id,
      r.address as reader_address,
      r.balance,
      r.creditLevel
    FROM hust_library_user_auth ua
    LEFT JOIN hust_library_user_profile up ON ua.id = up.auth_id
    LEFT JOIN hust_library_reader r ON ua.id = r.id
    WHERE ua.id = ?
  `).get(userId);
  db.close();
  return userInfo;
};

// 获取供应商图书供应视图
export const getSupplierBookSupply = () => {
  const db = getDatabase();
  const supply = db.prepare('SELECT * FROM supplier_book_supply').all();
  db.close();
  return supply;
};

// 获取库存预警视图
export const getLowStockAlert = () => {
  const db = getDatabase();
  const alerts = db.prepare('SELECT * FROM low_stock_alert').all();
  db.close();
  return alerts;
};

// 获取图书状态视图
export const getBookStatusView = () => {
  const db = getDatabase();
  const bookStatus = db.prepare('SELECT * FROM book_status_view').all();
  db.close();
  return bookStatus;
};

// 更新图书信息
export const updateBook = (id: number, name: string, author: string, price: number, publisher: string, stock: number, keyword: string) => {
  const db = getDatabase();
  
  // 开始事务
  db.prepare('BEGIN').run();
  
  try {
    // 更新图书基本信息
    const result = db.prepare(
      'UPDATE hust_library_book SET name = ?, price = ?, publish = ?, supplier = ?, stock = ?, keyword = ? WHERE id = ?'
    ).run(name, price, publisher, publisher, stock, keyword, id);
    
    // 删除现有的作者信息
    db.prepare('DELETE FROM hust_library_write WHERE book_id = ?').run(id);
    
    // 插入新的作者信息
    if (author) {
      // 如果作者是逗号分隔的多个作者，需要分别插入
      const authors = author.split(',').map((a: string) => a.trim()).filter((a: string) => a);
      for (const writer of authors) {
        db.prepare(
          'INSERT INTO hust_library_write (book_id, writer) VALUES (?, ?)'
        ).run(id, writer);
      }
    }
    
    // 提交事务
    db.prepare('COMMIT').run();
    
    db.close();
    return result;
  } catch (error) {
    // 回滚事务
    db.prepare('ROLLBACK').run();
    db.close();
    throw error;
  }
};

// 获取所有图书信息（包含作者）
export const getAllBooks = () => {
  const db = getDatabase();
  const books = db.prepare(`
    SELECT 
      b.id,
      b.name as title,
      b.price,
      b.publish,
      b.stock,
      GROUP_CONCAT(w.writer, ', ') as author,
      CASE 
        WHEN b.keyword LIKE '%技术%' OR b.keyword LIKE '%计算机%' THEN '技术'
        WHEN b.keyword LIKE '%生活%' OR b.keyword LIKE '%生活方式%' THEN '生活方式'
        WHEN b.keyword LIKE '%设计%' THEN '设计'
        WHEN b.keyword LIKE '%传记%' THEN '传记'
        WHEN b.keyword LIKE '%科幻%' THEN '科幻'
        ELSE '其他'
      END as tag
    FROM hust_library_book b
    LEFT JOIN hust_library_write w ON b.id = w.book_id
    GROUP BY b.id
    ORDER BY b.id
  `).all();
  db.close();
  return books;
};

// 获取用户的订单历史
export const getUserOrderHistory = (userId: number) => {
  const db = getDatabase();
  const orders = db.prepare(`
    SELECT 
      t.id,
      t.reader_id as orderId,
      b.name as title,
      t.time as date,
      t.status,
      t.quantity,
      t.price
    FROM hust_library_ticket t
    JOIN hust_library_book b ON t.id = b.id
    WHERE t.reader_id = ?
    ORDER BY t.time DESC
  `).all(userId);
  db.close();
  return orders;
};