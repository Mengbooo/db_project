import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 确保 db 目录存在
const dbDir = path.join(process.cwd(), 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created db directory');
}

// 创建或连接到 SQLite 数据库
const dbPath = path.join(dbDir, 'database.db');
const db = new Database(dbPath);

console.log(`Initializing database at ${dbPath}`);

// 创建网上书店系统所需的表

// 1. 图书信息表 hust_library_book
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    time INTEGER NOT NULL,
    price DECIMAL NOT NULL,
    publish VARCHAR(150) NOT NULL,
    keyword VARCHAR(150),
    stock INTEGER,
    supplier VARCHAR(10),
    seriesNo INTEGER
  )
`);

// 2. 图书存储位置表 hust_library_store
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_store (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state SMALLINT NOT NULL,
    book_id INTEGER NOT NULL,
    location VARCHAR(150) NOT NULL,
    FOREIGN KEY (book_id) REFERENCES hust_library_book (id)
  )
`);

// 3. 作者信息表 hust_library_write
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_write (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    writer VARCHAR(150) NOT NULL,
    FOREIGN KEY (book_id) REFERENCES hust_library_book (id)
  )
`);

// 4. 缺书信息表 hust_library_bookShortage
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_bookShortage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    publish VARCHAR(150) NOT NULL,
    supplier VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    registrationDate INTEGER NOT NULL
  )
`);

// 6. 订单表 hust_library_ticket
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    price DECIMAL,
    time INTEGER,
    quantity INTEGER,
    reader_id INTEGER,
    description TEXT,
    address VARCHAR(200),
    status VARCHAR(50),
    FOREIGN KEY (reader_id) REFERENCES hust_library_reader (id),
    FOREIGN KEY (book_id) REFERENCES hust_library_book (id)
  )
`);

// 5. 读者信息表 hust_library_reader
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_reader (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId VARCHAR(50),
    address VARCHAR(200),
    balance DECIMAL,
    creditLevel INTEGER
  )
`);

// 7. 供应商表 hust_library_supplier
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_supplier (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    category VARCHAR(100),
    region VARCHAR(100),
    website VARCHAR(255)
  )
`);

// 8. 采购单表 hust_library_purchase
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_purchase (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    quantity INTEGER,
    status VARCHAR(50) DEFAULT '待处理',
    FOREIGN KEY (book_id) REFERENCES hust_library_book (id)
  )
`);

// 9. 用户认证表 hust_library_user_auth (新添加)
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_user_auth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
  )
`);

// 10. 用户个人信息表 (包含原读者信息)
db.exec(`
  CREATE TABLE IF NOT EXISTS hust_library_user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auth_id INTEGER UNIQUE NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    address VARCHAR(200),
    balance DECIMAL,
    creditLevel INTEGER,
    avatar_url VARCHAR(255),
    FOREIGN KEY (auth_id) REFERENCES hust_library_user_auth (id) ON DELETE CASCADE
  )
`);

console.log('Database tables for online bookstore created successfully');

// 创建触发器

// 1. 当插入或更新订单时，自动更新图书库存
db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_book_stock_after_order
  AFTER INSERT ON hust_library_ticket
  FOR EACH ROW
  BEGIN
    UPDATE hust_library_book 
    SET stock = stock - NEW.quantity 
    WHERE id = NEW.id AND stock >= NEW.quantity;
  END
`);

// 2. 当图书库存低于10时，自动插入缺书登记
db.exec(`
  CREATE TRIGGER IF NOT EXISTS auto_register_book_shortage
  AFTER UPDATE ON hust_library_book
  FOR EACH ROW
  WHEN NEW.stock < 10 AND OLD.stock >= 10
  BEGIN
    INSERT INTO hust_library_bookShortage (name, publish, supplier, quantity, registrationDate)
    SELECT NEW.name, NEW.publish, NEW.supplier, 20, strftime('%s', 'now')
    FROM hust_library_book 
    WHERE id = NEW.id;
  END
`);

// 3. 当采购单完成时，自动更新图书库存
db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_book_stock_after_purchase
  AFTER INSERT ON hust_library_purchase
  FOR EACH ROW
  BEGIN
    UPDATE hust_library_book 
    SET stock = stock + NEW.quantity 
    WHERE id = NEW.book_id;
  END
`);

console.log('Database triggers created successfully');

// 创建视图

// 1. 图书详细信息视图（包含作者信息）
db.exec(`
  CREATE VIEW IF NOT EXISTS book_detail_view AS
  SELECT 
    b.id,
    b.name,
    b.price,
    b.publish,
    b.stock,
    GROUP_CONCAT(w.writer, ', ') as authors
  FROM hust_library_book b
  LEFT JOIN hust_library_write w ON b.id = w.book_id
  GROUP BY b.id
`);

// 2. 读者订单历史视图
db.exec(`
  CREATE VIEW IF NOT EXISTS reader_order_history AS
  SELECT 
    r.id as reader_id,
    r.userId,
    t.id as ticket_id,
    t.price,
    t.quantity,
    t.time,
    t.status
  FROM hust_library_reader r
  LEFT JOIN hust_library_ticket t ON r.id = t.reader_id
`);

// 3. 供应商图书供应视图
db.exec(`
  CREATE VIEW IF NOT EXISTS supplier_book_supply AS
  SELECT 
    s.id as supplier_id,
    s.name as supplier_name,
    b.id as book_id,
    b.name as book_name,
    b.stock
  FROM hust_library_supplier s
  LEFT JOIN hust_library_book b ON s.name = b.supplier
`);

// 4. 库存预警视图（库存低于10的图书）
db.exec(`
  CREATE VIEW IF NOT EXISTS low_stock_alert AS
  SELECT 
    id,
    name,
    publish,
    stock,
    supplier
  FROM hust_library_book
  WHERE stock < 10
`);

// 5. 图书状态视图
db.exec(`
  CREATE VIEW IF NOT EXISTS book_status_view AS
  SELECT 
    id,
    name,
    stock,
    CASE 
      WHEN stock <= 0 THEN 'Out of Stock'
      WHEN stock < 10 THEN 'Low Stock'
      ELSE 'In Stock'
    END as status
  FROM hust_library_book
`);

console.log('Database views created successfully');

// 示例数据

// 插入示例图书
db.exec("INSERT OR IGNORE INTO hust_library_book (id, name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (1, '计算机网络', 20200101, 59.99, '清华大学出版社', '计算机,网络', 100, '清华供应商', 1)");
db.exec("INSERT OR IGNORE INTO hust_library_book (id, name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (2, '数据库系统概念', 20190515, 79.99, '机械工业出版社', '数据库,系统', 50, '机工供应商', 2)");
// 新增更多示例图书
db.exec("INSERT OR IGNORE INTO hust_library_book (id, name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (3, '深入理解计算机系统', 20210315, 128.00, '人民邮电出版社', '计算机,系统', 30, '人邮供应商', 3)");
db.exec("INSERT OR IGNORE INTO hust_library_book (id, name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (4, '算法导论', 20181120, 99.00, '机械工业出版社', '计算机,算法', 25, '机工供应商', 4)");
db.exec("INSERT OR IGNORE INTO hust_library_book (id, name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (5, '三体', 20190901, 45.00, '重庆出版社', '科幻,小说', 75, '重庆供应商', 5)");
db.exec("INSERT OR IGNORE INTO hust_library_book (id, name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (6, '活着', 20200510, 35.00, '作家出版社', '文学,小说', 60, '作家供应商', 6)");
db.exec("INSERT OR IGNORE INTO hust_library_book (id, name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (7, '设计心理学', 20210101, 68.00, '中信出版社', '设计,心理学', 40, '中信供应商', 7)");
db.exec("INSERT OR IGNORE INTO hust_library_book (id, name, time, price, publish, keyword, stock, supplier, seriesNo) VALUES (8, '人类简史', 20191212, 52.00, '中信出版社', '历史,人文', 55, '中信供应商', 8)");

// 插入示例作者信息
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (1, 1, '谢希仁')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (2, 2, 'Abraham Silberschatz')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (3, 2, 'Henry F. Korth')");
// 新增更多作者信息
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (4, 3, 'Randal E. Bryant')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (5, 3, 'David R. O''Hallaron')");  // 转义单引号
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (6, 4, 'Thomas H. Cormen')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (7, 4, 'Charles E. Leiserson')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (8, 4, 'Ronald L. Rivest')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (9, 4, 'Clifford Stein')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (10, 5, '刘慈欣')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (11, 6, '余华')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (12, 7, 'Donald A. Norman')");
db.exec("INSERT OR IGNORE INTO hust_library_write (id, book_id, writer) VALUES (13, 8, '尤瓦尔·赫拉利')");

// 插入示例库存信息
db.exec("INSERT OR IGNORE INTO hust_library_store (id, state, book_id, location) VALUES (1, 1, 1, 'A区1架')");
db.exec("INSERT OR IGNORE INTO hust_library_store (id, state, book_id, location) VALUES (2, 1, 2, 'A区2架')");
// 新增更多库存信息
db.exec("INSERT OR IGNORE INTO hust_library_store (id, state, book_id, location) VALUES (3, 1, 3, 'B区1架')");
db.exec("INSERT OR IGNORE INTO hust_library_store (id, state, book_id, location) VALUES (4, 1, 4, 'B区2架')");
db.exec("INSERT OR IGNORE INTO hust_library_store (id, state, book_id, location) VALUES (5, 1, 5, 'C区1架')");
db.exec("INSERT OR IGNORE INTO hust_library_store (id, state, book_id, location) VALUES (6, 1, 6, 'C区2架')");
db.exec("INSERT OR IGNORE INTO hust_library_store (id, state, book_id, location) VALUES (7, 1, 7, 'D区1架')");
db.exec("INSERT OR IGNORE INTO hust_library_store (id, state, book_id, location) VALUES (8, 1, 8, 'D区2架')");

// 插入示例读者信息 (与用户认证信息关联)
db.exec("INSERT OR IGNORE INTO hust_library_reader (id, userId, address, balance, creditLevel) VALUES (1, 'admin', '北京市海淀区', 1000.00, 3)");
db.exec("INSERT OR IGNORE INTO hust_library_reader (id, userId, address, balance, creditLevel) VALUES (2, 'user', '上海市浦东区', 500.00, 2)");

// 插入示例订单信息
db.exec("INSERT OR IGNORE INTO hust_library_ticket (id, book_id, price, time, quantity, reader_id, description, address, status) VALUES (1, 1, 59.99, 20230101, 1, 1, '购买计算机网络教材', '北京市海淀区', '已发货')");

// 插入示例供应商信息
db.exec("INSERT OR IGNORE INTO hust_library_supplier (id, name, email, phone, category, region, website) VALUES (1, '清华大学出版社', 'contact@tsinghua.edu.cn', '010-12345678', '计算机,网络', '中国', 'www.tsinghuapress.com')");
db.exec("INSERT OR IGNORE INTO hust_library_supplier (id, name, email, phone, category, region, website) VALUES (2, '机械工业出版社', 'contact@cip.com.cn', '010-87654321', '计算机,算法', '中国', 'www.cip.com.cn')");
db.exec("INSERT OR IGNORE INTO hust_library_supplier (id, name, email, phone, category, region, website) VALUES (3, '人民邮电出版社', 'contact@ptpress.com.cn', '010-12345679', '计算机,系统', '中国', 'www.ptpress.com.cn')");
db.exec("INSERT OR IGNORE INTO hust_library_supplier (id, name, email, phone, category, region, website) VALUES (4, '重庆出版社', 'contact@cqpress.com', '023-12345678', '科幻,小说', '中国', 'www.cqpress.com')");
db.exec("INSERT OR IGNORE INTO hust_library_supplier (id, name, email, phone, category, region, website) VALUES (5, '作家出版社', 'contact@zuojiachubanshe.com', '010-23456789', '文学,小说', '中国', 'www.zuojiachubanshe.com')");
db.exec("INSERT OR IGNORE INTO hust_library_supplier (id, name, email, phone, category, region, website) VALUES (6, '中信出版社', 'contact@citicpub.com', '010-34567890', '设计,经济管理', '中国', 'www.citicpub.com')");

// 插入示例采购单信息
db.exec("INSERT OR IGNORE INTO hust_library_purchase (id, book_id, quantity, status) VALUES (1, 1, 20, '待处理')");
db.exec("INSERT OR IGNORE INTO hust_library_purchase (id, book_id, quantity, status) VALUES (2, 2, 15, '已完成')");
db.exec("INSERT OR IGNORE INTO hust_library_purchase (id, book_id, quantity, status) VALUES (3, 3, 10, '进行中')");

// 插入示例用户认证信息 (新添加)
db.exec("INSERT OR IGNORE INTO hust_library_user_auth (id, username, email, password_hash, role) VALUES (1, 'admin', 'admin@example.com', '123456', 'admin')");
db.exec("INSERT OR IGNORE INTO hust_library_user_auth (id, username, email, password_hash, role) VALUES (2, 'user', 'user@example.com', '123456', 'user')");

// 插入示例用户个人信息 (新添加)
db.exec("INSERT OR IGNORE INTO hust_library_user_profile (id, auth_id, full_name, phone, address, balance, creditLevel) VALUES (1, 1, '管理员', '13800138000', '北京市朝阳区', 1000.00, 3)");
db.exec("INSERT OR IGNORE INTO hust_library_user_profile (id, auth_id, full_name, phone, address, balance, creditLevel) VALUES (2, 2, '普通用户', '13900139000', '上海市浦东区', 500.00, 2)");

console.log('Sample data for online bookstore inserted');

// 验证数据库连接和数据
const books = db.prepare('SELECT * FROM hust_library_book').all();
console.log('Books in database:', books);

const readers = db.prepare('SELECT * FROM hust_library_reader').all();
console.log('Readers in database:', readers);

// 验证新添加的表
const users = db.prepare('SELECT * FROM hust_library_user_auth').all();
console.log('Users in database:', users);

// 验证视图
const bookDetailView = db.prepare('SELECT * FROM book_detail_view').all();
console.log('Book detail view:', bookDetailView);

const lowStockAlert = db.prepare('SELECT * FROM low_stock_alert').all();
console.log('Low stock alert:', lowStockAlert);

db.close();
console.log('Database initialization for online bookstore completed successfully!');