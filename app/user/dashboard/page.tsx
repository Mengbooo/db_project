'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus,
  MapPin,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  Truck,
  Settings, 
  AlertCircle,
  PackageCheck,
  ShoppingCart
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// 定义类型
type User = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  profile_address: string;
  balance: number;
  creditLevel: number;
  avatar_url: string | null;
};

type Book = {
  id: number;
  title: string;
  author: string;
  price: number;
  tag: string;
  stock: number;
  publish_time?: number; // 出版日期
};

type Order = {
  id: number;
  title: string;
  date: number;
  status: string;
  orderId: number;
};

type DashboardData = {
  user: User | null;
  books: Book[];
  orders: Order[];
};

type AIRecommendation = {
  book: Book;
  reason: string;
};

// 定义颜色数组
const BOOK_COLORS = [
  "from-blue-600 to-blue-400",
  "from-purple-600 to-purple-400",
  "from-rose-600 to-rose-400",
  "from-amber-600 to-amber-400",
  "from-emerald-600 to-emerald-400",
  "from-violet-600 to-violet-400",
  "from-cyan-600 to-cyan-400",
  "from-fuchsia-600 to-fuchsia-400",
  "from-lime-600 to-lime-400",
  "from-indigo-600 to-indigo-400",
];

// 将信用等级数字转换为中文名称
const getCreditLevelName = (level: number) => {
  switch(level) {
    case 1: return "普通会员";
    case 2: return "银卡会员";
    case 3: return "金卡会员";
    case 4: return "白金会员";
    case 5: return "钻石会员";
    default: return "普通会员";
  }
};

// 根据信用等级计算折扣率
const getDiscountRate = (level: number) => {
  switch(level) {
    case 1: return 0.10; // 10%折扣
    case 2: return 0.15; // 15%折扣
    case 3: return 0.15; // 15%折扣
    case 4: return 0.20; // 20%折扣
    case 5: return 0.25; // 25%折扣
    default: return 0.10;
  }
};

// 根据信用等级获取对应的样式
const getCreditLevelStyle = (level: number) => {
  switch(level) {
    case 1: return "text-gray-300 bg-gray-500/20 border border-gray-500/30"; // 普通会员 - 灰色
    case 2: return "text-gray-300 bg-gray-400/20 border border-gray-400/30"; // 银卡会员 - 银色
    case 3: return "text-yellow-300 bg-yellow-500/20 border border-yellow-500/30"; // 金卡会员 - 金色
    case 4: return "text-blue-300 bg-blue-500/20 border border-blue-500/30"; // 白金会员 - 蓝色
    case 5: return "text-cyan-300 bg-cyan-500/20 border border-cyan-500/30"; // 钻石会员 - 青色
    default: return "text-gray-300 bg-gray-500/20 border border-gray-500/30";
  }
};

// 将状态转换为样式
const getStatusStyle = (status: string) => {
  switch(status) {
    case '已送达': return "text-green-400 border-green-400/20 bg-green-400/10";
    case '运输中': return "text-blue-400 border-blue-400/20 bg-blue-400/10";
    case '待补货': return "text-orange-400 border-orange-400/20 bg-orange-400/10";
    case '待出库': return "text-gray-400 border-gray-400/20 bg-gray-400/10";
    default: return "text-gray-400 border-gray-400/20 bg-gray-400/10";
  }
};

// 格式化出版日期
const formatPublishDate = (dateNumber?: number) => {
  if (!dateNumber) return '未知日期';
  
  // 将YYYYMMDD格式的数字转换为日期字符串
  const dateStr = dateNumber.toString();
  if (dateStr.length !== 8) return '未知日期';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}-${month}-${day}`;
};

// 格式化分类标签
const formatCategoryTags = (category?: string) => {
  if (!category) return ['未分类'];
  
  // 分割所有关键词并去除空格
  const categories = category.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  return categories.length > 0 ? categories : ['未分类'];
};

// 修改函数签名以接收搜索参数
export default function Dashboard({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // 数据状态
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('2'); // 默认用户ID
  
  // 购物车状态
  const [cart, setCart] = useState<{book: Book, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartItemAnimations, setCartItemAnimations] = useState<Record<number, string>>({});

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 解包searchParams
        const params = await searchParams;
        const userIdParam = params.userId || '2';
        setUserId(userIdParam);
        
        // 获取仪表板数据
        const response = await fetch(`/api/dashboard?userId=${userIdParam}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('获取数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Filter books based on search
  const filteredBooks = dashboardData?.books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Helper to get icon for status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case '已送达': return <CheckCircle2 className="w-3 h-3" />;
      case '运输中': return <Truck className="w-3 h-3" />;
      case '待补货': return <AlertCircle className="w-3 h-3" />;
      case '待出库': return <PackageCheck className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  // 如果数据还在加载中
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">正在加载数据...</p>
        </div>
      </div>
    );
  }

  // 如果有错误
  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-lg">加载数据时出错: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0062c3] transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 如果没有数据
  if (!dashboardData) {
    return (
      <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-lg">无法加载仪表板数据</p>
        </div>
      </div>
    );
  }

  const { user, books, orders } = dashboardData;

  // 如果没有用户数据
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-lg">无法加载用户数据</p>
        </div>
      </div>
    );
  }

  // 添加到购物车函数
  const addToCart = (book: Book) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.book.id === book.id);
      if (existingItem) {
        // 如果书籍已在购物车中，增加数量
        return prevCart.map(item => 
          item.book.id === book.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // 如果书籍不在购物车中，添加新项目
        return [...prevCart, { book, quantity: 1 }];
      }
    });
    
    // 设置新添加项目的动画状态
    setCartItemAnimations(prev => ({ ...prev, [book.id]: 'fadeIn' }));
    
    // 显示sonner提示
    toast.success(`${book.title} 已添加到购物车`, {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    });
  };

  // 从购物车中移除书籍
  const removeFromCart = (bookId: number) => {
    // 设置删除动画
    setCartItemAnimations(prev => ({ ...prev, [bookId]: 'fadeOut' }));
    
    // 延迟一段时间后再实际移除项目，以显示动画效果
    setTimeout(() => {
      setCart(prevCart => prevCart.filter(item => item.book.id !== bookId));
      setCartItemAnimations(prev => {
        const newAnimations = { ...prev };
        delete newAnimations[bookId];
        return newAnimations;
      });
    }, 300); // 与CSS动画持续时间匹配
    
    // 显示sonner提示
    toast.info('书籍已从购物车移除', {
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    });
  };

  // 计算折扣后的总金额
  const calculateDiscountedTotal = () => {
    if (!user) return 0;
    const originalTotal = cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);
    const discountRate = getDiscountRate(user.creditLevel);
    return originalTotal * (1 - discountRate);
  };

  // 结算功能
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('购物车为空');
      return;
    }

    if (!user) {
      toast.error('用户信息加载失败');
      return;
    }

    // 检查用户是否已完善个人信息（地址和电话）
    if (!user.profile_address || user.profile_address.trim() === '' || !user.phone || user.phone.trim() === '') {
      toast.error('请先完善个人信息（地址和电话）后再进行购买', {
        action: {
          label: '完善信息',
          onClick: () => router.push(`/user/profile?userId=${userId}`)
        },
        duration: 5000,
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });
      return;
    }

    // 为 user 属性设置默认值，避免 null 或 undefined 错误
    const userBalance = user?.balance ?? 0;
    const userCreditLevel = user?.creditLevel ?? 1;

    const originalTotal = cart.reduce((total, item) => total + (item.book.price * item.quantity), 0);
    const discountRate = getDiscountRate(userCreditLevel);
    const totalAmount = originalTotal * (1 - discountRate);

    // 检查余额
    if (userBalance < totalAmount) {
      toast.error(`余额不足！当前余额：¥${userBalance.toFixed(2)}，需要：¥${totalAmount.toFixed(2)}`, {
        action: {
          label: '前往个人面板中充值',
          onClick: () => router.push(`/user/profile?userId=${userId}`)
        },
        duration: 5000,
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });
      return;
    }

    try {
      // 准备订单数据
      const orderItems = cart.map(item => ({
        bookId: item.book.id,
        quantity: item.quantity,
        price: item.book.price
      }));

      // 调用API创建订单
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          items: orderItems,
          totalAmount,
          originalAmount: originalTotal,
          discountRate,
          shippingAddress: user.profile_address
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '订单创建失败');
      }

      // 订单创建成功
      toast.success('订单创建成功！', {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        description: `已扣除 ¥${totalAmount.toFixed(2)}，剩余余额：¥${result.remainingBalance !== undefined ? result.remainingBalance.toFixed(2) : '未知'}`
      });

      // 清空购物车
      setCart([]);
      setShowCart(false);

      // 重新获取数据以更新余额、库存和订单历史
      const refreshResponse = await fetch(`/api/dashboard?userId=${userId}`);
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setDashboardData(refreshedData);
      }

    } catch (error) {
      console.error('结算失败:', error);
      toast.error(error instanceof Error ? error.message : '结算失败，请重试');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans flex items-center justify-center selection:bg-[#0071e3] selection:text-white overflow-hidden relative p-4 md:p-8">
      
      {/* 添加 Toaster 组件 */}
      <Toaster 
        position="top-right" 
        theme="dark"
        toastOptions={{
          duration: 3000,
          classNames: {
            toast: "bg-[#1a1a1a] border border-[#333] shadow-lg",
            title: "text-[#f5f5f7]",
            icon: "text-[#f5f5f7]",
            success: "bg-[#1a1a1a] border border-[#333]",
            error: "bg-[#1a1a1a] border border-[#333]",
            warning: "bg-[#1a1a1a] border border-[#333]",
          }
        }}
      />
      
      {/* --- Background Noise & Orbs --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
         <div 
          className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-[#0071e3] rounded-full blur-[250px] opacity-[0.1]"
          style={{ animation: 'pulse 15s ease-in-out infinite alternate' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#5ac8fa] rounded-full blur-[200px] opacity-[0.05]"
          style={{ animation: 'pulse 20s ease-in-out infinite alternate-reverse' }}
        />
      </div>

      {/* --- Main Glass Container (The "Island") --- */}
      <div className="relative z-10 w-full max-w-[1600px] h-[90vh] md:h-[85vh] bg-[#1c1c1e]/40 backdrop-blur-3xl border border-white/[0.08] rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">
          
          {/* === Left Sidebar (Info & History) === */}
          <aside className="w-full md:w-[320px] lg:w-[350px] bg-white/[0.02] border-r border-white/[0.05] flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
              
              {/* Profile Card */}
              <div className="bg-[#2c2c2e]/40 rounded-[24px] p-6 border border-white/5 shadow-lg hover:border-white/10 transition-colors duration-300 relative group">
                  {/* Edit Button */}
                  <button 
                    onClick={() => router.push(`/user/profile?userId=${userId}`)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-[#86868b] hover:bg-white/10 hover:text-white transition-all"
                    title="设置"
                  >
                      <Settings className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0071e3] to-[#5ac8fa] p-[2px] flex-shrink-0 shadow-lg shadow-blue-500/20">
                         <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center text-xl font-bold text-white">
                             {(user.full_name || user.username).charAt(0)}
                         </div>
                      </div>
                      <div>
                          <div className="text-xs text-[#0071e3] font-bold uppercase tracking-wider mb-1">个人信息</div>
                          <h2 className="text-xl font-bold text-white">{user.full_name || user.username}</h2>
                      </div>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-[#86868b] hover:text-white transition-colors">
                          <Mail className="w-4 h-4 text-white/40" />
                          <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#86868b] hover:text-white transition-colors">
                          <Phone className="w-4 h-4 text-white/40" />
                          <span>{user.phone || '未设置'}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-[#86868b] hover:text-white transition-colors">
                          <MapPin className="w-4 h-4 text-white/40 mt-0.5" />
                          <span className="leading-tight">{user.profile_address || '未设置'}</span>
                      </div>
                      
                      {/* 会员信息 */}
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-[#86868b]">会员等级</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCreditLevelStyle(user.creditLevel)}`}>
                            {getCreditLevelName(user.creditLevel)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[#86868b]">账户余额</span>
                          <span className="text-sm font-bold text-white">¥ {user.balance?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                  </div>
              </div>

              {/* Purchase History (Detailed Cards) */}
              <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4 px-1">
                      <h3 className="font-bold text-lg text-white">购买记录</h3>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                      {orders.map((item, index) => (
                          <div 
                            key={item.id} 
                            className="bg-[#2c2c2e]/30 border border-white/5 rounded-2xl p-4 hover:bg-[#3a3a3c]/40 hover:border-white/10 transition-all cursor-pointer group"
                            style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <div className="font-medium text-white group-hover:text-[#5ac8fa] transition-colors line-clamp-1">{item.title}</div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(item.status)}`}>
                                      {item.status}
                                  </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-[#86868b] mt-3">
                                  <div className="flex flex-col gap-0.5">
                                      <span className="font-mono text-white/40">#{item.orderId}</span>
                                      <span>{new Date(item.date * 1000).toLocaleDateString('zh-CN')}</span>
                                  </div>
                                  <div className="p-1.5 rounded-full bg-white/5 text-[#86868b] group-hover:text-white group-hover:bg-[#0071e3] transition-all">
                                      {getStatusIcon(item.status)}
                                  </div>
                              </div>
                          </div>
                      ))}
                      
                      {orders.length === 0 && (
                        <div className="text-center py-8 text-[#86868b]">
                          <PackageCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>暂无购买记录</p>
                        </div>
                      )}
                  </div>
              </div>

              {/* Brand Logo at Bottom Left */}
              <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">iB</span>
                </div>
                <span className="text-sm font-medium text-white">iBookStore</span>
              </div>
          </aside>

          {/* === Right Content (Books Store) === */}
          <main className="flex-1 flex flex-col relative bg-gradient-to-br from-transparent to-black/20">
              
              {/* Top Bar: Search & Cart */}
              <header className="h-24 flex items-center px-8 gap-6 shrink-0">
                  <div className="relative flex-1 min-w-0 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors z-10" />
                      <input 
                          type="text" 
                          placeholder="搜索书籍、作者" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#0a0a0c]/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-[#0071e3] focus:bg-[#0a0a0c]/80 transition-all outline-none placeholder:text-[#515154] shadow-inner"
                      />
                  </div>
                  
                  {/* 购物车按钮 */}
                  <button 
                    onClick={() => setShowCart(!showCart)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/10 bg-[#0a0a0c]/40 text-[#86868b] hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95 relative"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-sm font-medium">购物车</span>
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#0071e3] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                      </span>
                    )}
                  </button>
              </header>

              {/* 购物车面板 */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showCart ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="mx-8 p-6 border border-white/10 rounded-[24px] relative overflow-hidden shrink-0 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">购物车</h3>
                  
                  {cart.length === 0 ? (
                    <p className="text-[#86868b] py-4">购物车为空</p>
                  ) : (
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {cart.map((item, index) => (
                        <div 
                          key={item.book.id} 
                          data-book-id={item.book.id}
                          className={`flex items-center justify-between p-3 bg-[#2c2c2e]/40 rounded-xl border border-white/5 ${
                            cartItemAnimations[item.book.id] === 'fadeIn' ? 'animate-fade-in-up' : 
                            cartItemAnimations[item.book.id] === 'fadeOut' ? 'animate-fade-out' : ''
                          }`}
                          style={
                            cartItemAnimations[item.book.id] === 'fadeIn' ? 
                            { animation: `fadeInUp 0.3s ease-out ${index * 0.1}s forwards`, opacity: 0 } : 
                            {}
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-16 h-16 rounded bg-gradient-to-br ${BOOK_COLORS[item.book.id % BOOK_COLORS.length]} flex-shrink-0 shadow-lg`}></div>
                            <div>
                              <h4 className="font-medium text-white text-sm line-clamp-1">{item.book.title}</h4>
                              <p className="text-xs text-[#86868b]">{item.book.author}</p>
                              <p className="text-sm font-semibold text-white">¥{item.book.price.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    setCart(prevCart => 
                                      prevCart.map(cartItem => 
                                        cartItem.book.id === item.book.id 
                                          ? { ...cartItem, quantity: cartItem.quantity - 1 } 
                                          : cartItem
                                      )
                                    );
                                  }
                                }}
                                className="w-6 h-6 rounded-full bg-[#3a3a3c] text-[#86868b] flex items-center justify-center hover:bg-[#0071e3] hover:text-white transition-colors"
                              >
                                -
                              </button>
                              <span className="text-white w-8 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => {
                                  setCart(prevCart => 
                                    prevCart.map(cartItem => 
                                      cartItem.book.id === item.book.id 
                                        ? { ...cartItem, quantity: cartItem.quantity + 1 } 
                                        : cartItem
                                    )
                                  );
                                }}
                                className="w-6 h-6 rounded-full bg-[#3a3a3c] text-[#86868b] flex items-center justify-center hover:bg-[#0071e3] hover:text-white transition-colors"
                              >
                                +
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => removeFromCart(item.book.id)}
                              className="text-[#86868b] hover:text-red-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t border-white/10 space-y-3">
                        {/* 会员折扣信息 */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[#86868b]">会员等级</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCreditLevelStyle(user.creditLevel)}`}>
                              {getCreditLevelName(user.creditLevel)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#86868b]">专享折扣</span>
                            <span className="text-sm font-bold text-[#0071e3]">{(getDiscountRate(user.creditLevel) * 100).toFixed(0)}% OFF</span>
                          </div>
                        </div>
                        
                        {/* 价格明细 */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[#86868b]">原价</span>
                            <span className="text-white">¥{cart.reduce((total, item) => total + (item.book.price * item.quantity), 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[#86868b]">会员优惠</span>
                            <span className="text-green-400">-¥{(cart.reduce((total, item) => total + (item.book.price * item.quantity), 0) * getDiscountRate(user.creditLevel)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-white/10">
                            <span className="text-white font-medium">应付总额</span>
                            <span className="text-xl font-bold text-white">¥{calculateDiscountedTotal().toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={handleCheckout}
                          className="w-full bg-[#0071e3] hover:bg-[#0062c3] text-white px-6 py-3 rounded-xl font-medium transition-colors active:scale-95"
                        >
                          立即结算
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Books Section Title */}
              <div className="px-8 mb-6 flex flex-col gap-4 shrink-0">
                  <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                      精选书籍 <span className="w-2 h-2 rounded-full bg-[#0071e3]"></span>
                  </h2>
              </div>

              {/* Books Grid (Scrollable) */}
              <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredBooks.map((book, index) => (
                          <div 
                              key={book.id} 
                              className="group bg-[#2c2c2e]/40 rounded-[24px] p-4 border border-white/5 hover:bg-[#3a3a3c]/60 hover:border-[#0071e3]/30 transition-all duration-500 shadow-lg hover:shadow-black/50 flex flex-col"
                              style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.05}s forwards`, opacity: 0 }}
                          >
                              {/* Cover */}
                              <div className={`w-full h-48 rounded-2xl bg-gradient-to-br ${BOOK_COLORS[book.id % BOOK_COLORS.length]} relative overflow-hidden shadow-inner mb-4 group-hover:shadow-2xl transition-all`}>
                                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
                                  <div className="absolute inset-0 flex items-center justify-center p-4">
                                      <span className="font-bold text-white/80 text-center text-lg leading-tight drop-shadow-lg">
                                          {book.title}
                                      </span>
                                  </div>
                                  {book.stock < 10 && (
                                    <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold border border-red-300/30 shadow-sm">
                                        仅剩{book.stock}本
                                    </div>
                                  )}
                              </div>

                              {/* Info */}
                              <div className="flex flex-col flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                      {formatCategoryTags(book.tag).map((tag, index) => (
                                        <span key={index} className="text-[10px] text-[#0071e3] bg-[#0071e3]/10 px-1.5 py-0.5 rounded border border-[#0071e3]/20 font-bold">
                                          {tag}
                                        </span>
                                      ))}
                                  </div>
                                  <h3 className="text-white font-bold text-base truncate mb-1 group-hover:text-[#5ac8fa] transition-colors">{book.title}</h3>
                                  <p className="text-[#86868b] text-xs mb-1">{book.author}</p>
                                  <p className="text-[#666] text-xs mb-3">{formatPublishDate(book.publish_time)}</p>
                                  
                                  <div className="mt-auto flex items-center justify-between">
                                      <span className="text-white font-semibold">¥{book.price.toFixed(2)}</span>
                                      <button 
                                        onClick={() => addToCart(book)}
                                        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#0071e3] hover:text-white transition-all shadow-md active:scale-90 hover:shadow-lg hover:shadow-blue-500/30 transform transition-transform duration-200"
                                      >
                                          <Plus className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                      
                      {filteredBooks.length === 0 && (
                        <div className="col-span-full text-center py-12 text-[#86868b]">
                          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>没有找到相关书籍</p>
                        </div>
                      )}
                  </div>
              </div>

          </main>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.05; transform: scale(1); }
          100% { opacity: 0.1; transform: scale(1.05); }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to { opacity: 0; transform: translateY(20px) scale(0.8); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
        .animate-fade-out { animation: fadeOut 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}