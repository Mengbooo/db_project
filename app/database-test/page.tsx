'use client';

import { useState, useEffect, ReactElement } from 'react';

export default function DatabaseTest() {
  const [data, setData] = useState<{
    books: any[];
    readers: any[];
    tickets: any[];
    suppliers: any[];
    stores: any[];
    purchases: any[];
    shortages: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('books');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/database');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data from database');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          <p className="mt-4 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <div className="bg-zinc-900 border border-zinc-700 text-red-400 px-4 py-3 rounded relative max-w-md" role="alert">
          <strong className="font-bold">错误: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <div className="bg-zinc-900 border border-zinc-700 text-yellow-400 px-4 py-3 rounded relative max-w-md" role="alert">
          <strong className="font-bold">提示: </strong>
          <span className="block sm:inline">暂无数据</span>
        </div>
      </div>
    );
  }

  const { books, readers, tickets, suppliers, stores, purchases, shortages } = data;

  const renderTable = (headers: string[], data: any[], renderRow: (item: any) => ReactElement) => {
    if (data.length === 0) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-zinc-300">
                暂无数据
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-900">
              <tr>
                {headers.map((header, index) => (
                  <th 
                    key={index} 
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-zinc-950 divide-y divide-zinc-800">
              {data.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-zinc-900">
                  {renderRow(item)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className=" flex justify-center items-center min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="border-b border-zinc-800">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'books', name: '图书信息', count: books.length },
                { id: 'readers', name: '读者信息', count: readers.length },
                { id: 'tickets', name: '订单信息', count: tickets.length },
                { id: 'suppliers', name: '供应商信息', count: suppliers.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-zinc-100 text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'books' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">图书信息</h2>
                {renderTable(
                  ['ID', '书名', '作者', '出版社', '价格', '库存'],
                  books,
                  (book) => (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{book.id}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{book.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{book.authors || '未知'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{book.publish}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">¥{book.price}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{book.stock || 0}</td>
                    </>
                  )
                )}
              </div>
            )}

            {activeTab === 'readers' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">读者信息</h2>
                {renderTable(
                  ['ID', '用户ID', '地址', '余额', '信用等级'],
                  readers,
                  (reader) => (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{reader.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{reader.userId || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{reader.address || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">¥{reader.balance || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                          {reader.creditLevel || 'N/A'}
                        </span>
                      </td>
                    </>
                  )
                )}
              </div>
            )}

            {activeTab === 'tickets' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">订单信息</h2>
                {renderTable(
                  ['ID', '价格', '数量', '读者ID', '状态'],
                  tickets,
                  (ticket) => (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{ticket.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">¥{ticket.price || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{ticket.quantity || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{ticket.reader_id || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ticket.status === '已发货' 
                            ? 'bg-green-900 text-green-300' 
                            : ticket.status === '待处理' 
                              ? 'bg-yellow-900 text-yellow-300' 
                              : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {ticket.status || 'N/A'}
                        </span>
                      </td>
                    </>
                  )
                )}
              </div>
            )}

            {activeTab === 'suppliers' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">供应商信息</h2>
                {renderTable(
                  ['ID', '名称', '电话', '供货信息'],
                  suppliers,
                  (supplier) => (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{supplier.id}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{supplier.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{supplier.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{supplier.supplyInfo || 'N/A'}</td>
                    </>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}