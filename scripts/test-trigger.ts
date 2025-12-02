import Database from 'better-sqlite3';
import path from 'path';

// 获取数据库实例
const getDatabase = () => {
  const dbPath = path.join(process.cwd(), 'db', 'database.db');
  return new Database(dbPath);
};

console.log('Testing triggers...');

const db = getDatabase();

// 测试前检查图书库存
console.log('\n--- 测试前图书库存 ---');
const booksBefore: any[] = db.prepare('SELECT id, name, stock FROM hust_library_book').all();
booksBefore.forEach((book: any) => {
  console.log(`图书ID: ${book.id}, 书名: ${book.name}, 库存: ${book.stock}`);
});

// 测试1: 创建新订单触发器
console.log('\n--- 测试1: 创建新订单触发器 ---');
console.log('创建一个订单，购买2本《计算机网络》...');
const insertTicket = db.prepare(`
  INSERT INTO hust_library_ticket (price, time, quantity, reader_id, description, address, status)
  VALUES (119.98, 20230102, 2, 2, '购买2本计算机网络教材', '上海市浦东区', '待处理')
`);
insertTicket.run();
console.log('订单创建完成');

// 检查触发器是否更新了库存
console.log('\n--- 触发器执行后图书库存 ---');
const booksAfterOrder: any = db.prepare('SELECT id, name, stock FROM hust_library_book WHERE id = 1').get();
console.log(`图书ID: ${booksAfterOrder.id}, 书名: ${booksAfterOrder.name}, 库存: ${booksAfterOrder.stock}`);

// 测试2: 库存低于10触发缺书登记
console.log('\n--- 测试2: 库存低于10触发缺书登记 ---');
console.log('将《数据库系统概念》库存减少到5本...');
const updateBook = db.prepare(`
  UPDATE hust_library_book 
  SET stock = 5 
  WHERE id = 2
`);
updateBook.run();
console.log('库存更新完成');

// 检查是否自动创建了缺书登记
console.log('\n--- 检查是否自动创建了缺书登记 ---');
const shortageRecords: any[] = db.prepare('SELECT * FROM hust_library_bookShortage').all();
if (shortageRecords.length > 0) {
  console.log('成功创建缺书登记:');
  shortageRecords.forEach((record: any) => {
    console.log(`  ID: ${record.id}, 书名: ${record.name}, 数量: ${record.quantity}, 日期: ${record.registrationDate}`);
  });
} else {
  console.log('未找到缺书登记记录');
}

// 测试3: 采购单触发库存更新
console.log('\n--- 测试3: 采购单触发库存更新 ---');
console.log('创建一个采购单，采购10本《数据库系统概念》...');
const insertPurchase = db.prepare(`
  INSERT INTO hust_library_purchase (book_id, quantity)
  VALUES (2, 10)
`);
insertPurchase.run();
console.log('采购单创建完成');

// 检查触发器是否更新了库存
console.log('\n--- 触发器执行后图书库存 ---');
const booksAfterPurchase: any = db.prepare('SELECT id, name, stock FROM hust_library_book WHERE id = 2').get();
console.log(`图书ID: ${booksAfterPurchase.id}, 书名: ${booksAfterPurchase.name}, 库存: ${booksAfterPurchase.stock}`);

// 测试视图
console.log('\n--- 测试视图 ---');
console.log('图书详细信息视图:');
const bookDetailView: any[] = db.prepare('SELECT * FROM book_detail_view').all();
bookDetailView.forEach((book: any) => {
  console.log(`  ID: ${book.id}, 书名: ${book.name}, 作者: ${book.authors}`);
});

console.log('\n库存预警视图:');
const lowStockAlert: any[] = db.prepare('SELECT * FROM low_stock_alert').all();
if (lowStockAlert.length > 0) {
  lowStockAlert.forEach((alert: any) => {
    console.log(`  ID: ${alert.id}, 书名: ${alert.name}, 库存: ${alert.stock}`);
  });
} else {
  console.log('  没有库存低于10的图书');
}

db.close();
console.log('\n触发器和视图测试完成!');