'use client';

import { useState, useEffect, ReactElement } from 'react';

export default function TriggerViewTest() {
  const [data, setData] = useState<{
    bookDetailView: any[];
    readerOrderHistory: any[];
    supplierBookSupply: any[];
    lowStockAlert: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('bookDetail');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/database');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        // 只需要视图数据
        setData({
          bookDetailView: result.bookDetailView,
          readerOrderHistory: result.readerOrderHistory,
          supplierBookSupply: result.supplierBookSupply,
          lowStockAlert: result.lowStockAlert
        });
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

  const { bookDetailView, readerOrderHistory, supplierBookSupply, lowStockAlert } = data;

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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight">
            网上书店触发器和视图测试
          </h1>
          <p className="mt-2 text-zinc-400">
            测试数据库中的触发器和视图功能
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="border-b border-zinc-800">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'bookDetail', name: '图书详细信息视图', count: bookDetailView.length },
                    { id: 'orderHistory', name: '读者订单历史视图', count: readerOrderHistory.length },
                    { id: 'supplierSupply', name: '供应商供应视图', count: supplierBookSupply.length },
                    { id: 'lowStock', name: '库存预警视图', count: lowStockAlert.length },
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
                {activeTab === 'bookDetail' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">图书详细信息视图</h2>
                    <p className="text-zinc-400 mb-4">显示图书及其作者信息的组合视图</p>
                    {renderTable(
                      ['ID', '书名', '价格', '出版社', '库存', '作者'],
                      bookDetailView,
                      (book) => (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{book.id}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{book.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">¥{book.price}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{book.publish}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{book.stock}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{book.authors || '未知'}</td>
                        </>
                      )
                    )}
                  </div>
                )}

                {activeTab === 'orderHistory' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">读者订单历史视图</h2>
                    <p className="text-zinc-400 mb-4">显示读者及其订单历史的关联视图</p>
                    {renderTable(
                      ['读者ID', '用户ID', '订单ID', '价格', '数量', '时间', '状态'],
                      readerOrderHistory,
                      (history) => (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{history.reader_id}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{history.userId || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{history.ticket_id || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">¥{history.price || 0}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{history.quantity || 0}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{history.time || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              history.status === '已发货' 
                                ? 'bg-green-900 text-green-300' 
                                : history.status === '待处理' 
                                  ? 'bg-yellow-900 text-yellow-300' 
                                  : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              {history.status || 'N/A'}
                            </span>
                          </td>
                        </>
                      )
                    )}
                  </div>
                )}

                {activeTab === 'supplierSupply' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">供应商供应视图</h2>
                    <p className="text-zinc-400 mb-4">显示供应商及其供应图书的关联视图</p>
                    {renderTable(
                      ['供应商ID', '供应商名称', '图书ID', '图书名称', '库存'],
                      supplierBookSupply,
                      (supply) => (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{supply.supplier_id}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{supply.supplier_name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{supply.book_id || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{supply.book_name || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{supply.stock || 0}</td>
                        </>
                      )
                    )}
                  </div>
                )}

                {activeTab === 'lowStock' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">库存预警视图</h2>
                    <p className="text-zinc-400 mb-4">显示库存低于10本的图书</p>
                    {renderTable(
                      ['ID', '书名', '出版社', '库存', '供应商'],
                      lowStockAlert,
                      (alert) => (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{alert.id}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{alert.name}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{alert.publish}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-300">{alert.stock}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{alert.supplier}</td>
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">触发器测试说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-medium text-zinc-200 mb-2">库存更新触发器</h3>
              <p className="text-sm text-zinc-400">当创建新订单时，自动减少相应图书的库存数量。</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-medium text-zinc-200 mb-2">缺书登记触发器</h3>
              <p className="text-sm text-zinc-400">当图书库存低于10本时，自动创建缺书登记记录。</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-medium text-zinc-200 mb-2">采购更新触发器</h3>
              <p className="text-sm text-zinc-400">当完成采购单时，自动增加相应图书的库存数量。</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-zinc-500 text-sm">
          <p>© 2025 网上书店数据库管理系统</p>
        </div>
      </div>
    </div>
  );
}