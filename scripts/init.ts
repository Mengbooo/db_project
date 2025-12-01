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

// 创建示例表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id)
  )
`);

console.log('Database tables created successfully');

// 插入一些示例数据
const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)');
insertUser.run('Alice', 'alice@example.com');
insertUser.run('Bob', 'bob@example.com');

console.log('Sample data inserted');

// 验证数据库连接和数据
const users = db.prepare('SELECT * FROM users').all();
console.log('Users in database:', users);

db.close();
console.log('Database initialization completed successfully!');