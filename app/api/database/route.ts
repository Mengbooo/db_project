import { NextResponse } from 'next/server';
import { 
  getDatabase,
  getBooks,
  getReaders,
  getTickets,
  getSuppliers,
  getStores,
  getPurchases,
  getBookShortages,
  getBooksWithAuthors,
  getBookDetailView,
  getReaderOrderHistory,
  getSupplierBookSupply,
  getLowStockAlert
} from '@/lib/db';

export async function GET() {
  try {
    // 测试数据库连接
    const db = getDatabase();
    db.close();
    
    // 获取网上书店系统的数据
    const books = getBooksWithAuthors();
    const readers = getReaders();
    const tickets = getTickets();
    const suppliers = getSuppliers();
    const stores = getStores();
    const purchases = getPurchases();
    const shortages = getBookShortages();
    
    // 获取视图数据
    const bookDetailView = getBookDetailView();
    const readerOrderHistory = getReaderOrderHistory();
    const supplierBookSupply = getSupplierBookSupply();
    const lowStockAlert = getLowStockAlert();
    
    return NextResponse.json({ 
      books, 
      readers, 
      tickets, 
      suppliers, 
      stores, 
      purchases, 
      shortages,
      bookDetailView,
      readerOrderHistory,
      supplierBookSupply,
      lowStockAlert
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from database' },
      { status: 500 }
    );
  }
}