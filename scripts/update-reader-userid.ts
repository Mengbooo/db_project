import Database from 'better-sqlite3';
import path from 'path';

// 连接到 SQLite 数据库
const dbPath = path.join(process.cwd(), 'db', 'database.db');
const db = new Database(dbPath);

console.log(`Updating reader userId values in database at ${dbPath}`);

// 更新读者表中前两个记录的userId
try {
  // 更新第一个读者的userId为'admin'
  const updateFirst = db.prepare(
    "UPDATE hust_library_reader SET userId = 'admin' WHERE id = 1"
  ).run();
  
  // 更新第二个读者的userId为'user'
  const updateSecond = db.prepare(
    "UPDATE hust_library_reader SET userId = 'user' WHERE id = 2"
  ).run();
  
  console.log(`Updated ${updateFirst.changes} row(s) for reader id 1`);
  console.log(`Updated ${updateSecond.changes} row(s) for reader id 2`);
  
  // 验证更新结果
  const readers = db.prepare('SELECT * FROM hust_library_reader WHERE id IN (1, 2)').all();
  console.log('Updated readers:', readers);
  
  db.close();
  console.log('Database update completed successfully!');
} catch (error) {
  console.error('Error updating reader userId values:', error);
  db.close();
}