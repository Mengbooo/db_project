import Database from 'better-sqlite3';
import path from 'path';

// 创建或连接到 SQLite 数据库
const dbPath = path.join(process.cwd(), 'db', 'database.db');
const db = new Database(dbPath);

console.log('Updating book stock to test low stock alert...');

// 更新一本书的库存为5（低于10）
db.exec("UPDATE hust_library_book SET stock = 5 WHERE id = 1");

console.log('Book stock updated.');

// 查询低库存警告视图
const lowStockAlert = db.prepare('SELECT * FROM low_stock_alert').all();
console.log('Low stock alert view:', lowStockAlert);

db.close();