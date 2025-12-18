'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { 
  User, 
  Shield, 
  CreditCard, 
  Bell, 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2,
  Lock,
  Globe,
  Clock,
  Wallet,
  Plus,
  Package,
  CheckCircle2,
  Truck,
  AlertCircle,
  Crown,
  X,
  Link,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';

// 定义用户类型
type UserData = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  profile_address: string;
  balance: number;
  creditLevel: number;
  avatar_url: string | null;
  level: string;
  points: number;
  nextLevelProgress: number;
};

// --- Mock Data (用于订单历史) ---
const MOCK_ORDERS = [
  { id: "ORD-2023-1024", date: "2023-10-24", items: "The Art of Code, Deep Work", quantity: 2, total: 161.00, status: "已完成" },
  { id: "ORD-2023-1020", date: "2023-10-20", items: "Steve Jobs Biography", quantity: 1, total: 68.00, status: "派送中" },
  { id: "ORD-2023-1015", date: "2023-10-15", items: "Minimalist Living", quantity: 1, total: 45.00, status: "待发货" },
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

export default function ProfilePage({ searchParams }: { searchParams: Promise<{ userId?: string; tab?: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general'); // general, security, billing, notifications
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    avatarUrl: ''
  });
  const [userId, setUserId] = useState<string>('2'); // 默认用户ID
  
  // Password Strength State
  const [currentPassword, setCurrentPassword] = useState(""); // 当前密码（从数据库加载）
  const [showPassword, setShowPassword] = useState(false); // 是否显示密码
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Top Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isToppingUp, setIsToppingUp] = useState(false);
  
  // Order State
  const [orders, setOrders] = useState<any[]>([]);
  const [isCancellingOrder, setIsCancellingOrder] = useState<number | null>(null);

  // 获取 URL 参数中的 userId 并加载用户数据 - 仅在初始化时执行
  useEffect(() => {
    const initializeParams = async () => {
      try {
        const params = await searchParams;
        const userIdParam = params.userId || '2';
        const tabParam = params.tab || 'general';
        
        // 如果userId改变，才重新加载数据
        if (userIdParam !== userId) {
          setUserId(userIdParam);
          setLoading(true);
          
          // 从 API 获取用户数据
          const response = await fetch(`/api/dashboard?userId=${userIdParam}`);
          if (!response.ok) {
            throw new Error('获取用户信息失败');
          }
          
          const data = await response.json();
          if (data.user) {
            const user = data.user;
            // 设置用户完整数据
            setUserData({
              id: user.id,
              username: user.username,
              email: user.email,
              full_name: user.full_name || user.username,
              phone: user.phone || '',
              profile_address: user.profile_address || '',
              balance: user.balance || 0,
              creditLevel: user.creditLevel || 1,
              avatar_url: user.avatar_url,
              level: getCreditLevelName(user.creditLevel || 1),
              points: 1250,
              nextLevelProgress: 75
            });
            
            // 设置表单数据
            setFormData({
              full_name: user.full_name || user.username,
              email: user.email,
              phone: user.phone || '',
              address: user.profile_address || '',
              avatarUrl: user.avatar_url || ''
            });
            
            // 获取当前密码
            setCurrentPassword(user.password || '');
          }
          
          // 加载订单数据
          if (data.orders) {
            setOrders(data.orders);
          }
          
          setLoading(false);
        } else {
          // 如果userId相同，仅更新tab（不加载数据）
          setActiveTab(tabParam);
        }
      } catch (error) {
        console.error('获取用户数据失败:', error);
        toast.error('获取用户数据失败');
        setLoading(false);
      }
    };
    
    initializeParams();
  }, [searchParams]);

  const handleSave = async () => {
    if (!userData) {
      toast.error('用户数据未加载');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userData.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          avatar_url: formData.avatarUrl
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('个人信息更新成功');
        // 更新本地用户数据
        setUserData({
          ...userData,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          profile_address: formData.address,
          avatar_url: formData.avatarUrl
        });
      } else {
        throw new Error(result.error || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      toast.error(error instanceof Error ? error.message : '更新失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topUpAmount || isNaN(Number(topUpAmount)) || Number(topUpAmount) <= 0) {
        toast.error("请输入有效的充值金额");
        return;
    }

    if (!userData) {
      toast.error('用户数据未加载');
      return;
    }

    setIsToppingUp(true);
    try {
      const newBalance = userData.balance + Number(topUpAmount);
      
      // 调用 API 更新余额
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userData.id,
          balance: newBalance,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 更新本地用户数据
        setUserData({
          ...userData,
          balance: newBalance
        });
        setIsTopUpOpen(false);
        setTopUpAmount('');
        toast.success(`充值成功！已充值 ¥${Number(topUpAmount).toFixed(2)}`);
      } else {
        throw new Error(result.error || '充值失败');
      }
    } catch (error) {
      console.error('充值失败:', error);
      toast.error(error instanceof Error ? error.message : '充值失败，请重试');
    } finally {
      setIsToppingUp(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
      if (!pwd || pwd.length === 0) return 0;
      if (pwd.length < 6) return 1; // 弱
      if (pwd.length < 10) return 2; // 中
      return 3; // 强
  };

  const strength = getPasswordStrength(currentPassword); // 根据当前密码判断强度

  // 保存密码修改
  const handlePasswordSave = async () => {
    if (!userData) {
      toast.error('用户数据未加载');
      return;
    }

    // 验证新密码和确认密码
    if (!newPassword || !confirmPassword) {
      toast.error('请输入新密码和确认密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('密码长度不能少于6位');
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userData.id,
          password: newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('密码修改成功');
        // 更新当前密码
        setCurrentPassword(newPassword);
        // 清空输入框
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(result.error || '密码修改失败');
      }
    } catch (error) {
      console.error('密码修改失败:', error);
      toast.error(error instanceof Error ? error.message : '密码修改失败，请重试');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // 取消订单
  const handleCancelOrder = async (orderId: number, orderStatus: string) => {
    // 检查订单状态，仅在"待补货"和"待出库"状态下可以取消
    if (orderStatus !== '待补货' && orderStatus !== '待出库') {
      toast.error(`订单状态为"${orderStatus}"，无法取消`);
      return;
    }

    setIsCancellingOrder(orderId);
    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('订单已取消，已为您退款');
        // 刷新订单和余额数据，保持当前tab不变
        await refreshOrdersData();
      } else {
        throw new Error(result.error || '取消订单失败');
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      toast.error(error instanceof Error ? error.message : '取消订单失败，请重试');
    } finally {
      setIsCancellingOrder(null);
    }
  };

  // 退出登录
  const handleLogout = () => {
    toast.success('退出登录成功');
    // 清除本地存储的用户信息（如果有）
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    // 跳转到登录页面
    router.push('/auth');
  };

  // 处理tab切换，同时更新URL参数
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`?userId=${userId}&tab=${newTab}`);
  };

  // 转换订单数据并保持tab不变
  const refreshOrdersData = async () => {
    try {
      const response = await fetch(`/api/dashboard?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.orders) {
          setOrders(data.orders);
        }
        if (data.user) {
          const user = data.user;
          setUserData(prev => prev ? {
            ...prev,
            balance: user.balance || 0
          } : null);
        }
      }
    } catch (error) {
      console.error('刷新订单数据失败:', error);
    }
  };

  // 生成16位会员编号（基于 userId）
  const getMembershipNumber = (userId: number) => {
    return userId.toString().padStart(16, '0');
  };

  // 格式化会员编号为 "XXXX XXXX XXXX XXXX" 格式
  const formatMembershipNumber = (number: string) => {
    return number.match(/.{1,4}/g)?.join(' ') || number;
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">正在加载用户数据...</p>
        </div>
      </div>
    );
  }

  // 没有用户数据
  if (!userData) {
    return (
      <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">无法加载用户数据</p>
          <button 
            onClick={() => router.push(`/user/dashboard?userId=${userId}`)}
            className="mt-4 px-4 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0062c3] transition-colors"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

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
      
      {/* --- Background --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
         <div 
            className="absolute top-[-20%] left-[20%] w-[1000px] h-[1000px] bg-[#0071e3] rounded-full blur-[250px] opacity-[0.08]"
            style={{ animation: 'pulse 15s ease-in-out infinite alternate' }} 
         ></div>
         <div 
            className="absolute bottom-[-10%] right-[10%] w-[800px] h-[800px] bg-[#bf5af2] rounded-full blur-[200px] opacity-[0.05]"
            style={{ animation: 'pulse 20s ease-in-out infinite alternate-reverse' }} 
         ></div>
      </div>

      {/* --- Main Container --- */}
      <div className="relative z-10 w-full max-w-[1600px] h-[85vh] bg-[#1c1c1e]/60 backdrop-blur-3xl border border-white/[0.08] rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up ring-1 ring-white/10">
          
          {/* === Sidebar === */}
          <aside className="w-full md:w-72 bg-black/20 border-r border-white/[0.05] flex flex-col p-6 backdrop-blur-md">
              
              {/* Back Button */}
              <button 
                onClick={() => router.push(`/user/dashboard?userId=${userId}`)}
                className="flex items-center gap-2 text-[#86868b] hover:text-white transition-colors mb-8 group"
              >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-medium">返回主页</span>
              </button>

              {/* User Snapshot */}
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/5">
                  <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0071e3] to-[#5ac8fa] p-[2px] shadow-2xl shadow-blue-500/20">
                          <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                              {/* 优先显示 avatarUrl 图片，如果没有则显示首字母 */}
                              {formData.avatarUrl ? (
                                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                  userData.full_name.charAt(0).toUpperCase()
                              )}
                          </div>
                      </div>
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-white">{userData.full_name}</h2>
                  <p className="text-xs text-[#0071e3] font-medium bg-[#0071e3]/10 px-2 py-0.5 rounded-full mt-1 border border-[#0071e3]/20">{userData.level}</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex flex-col gap-2 space-y-1">
                  <TabItem 
                    icon={<User />} 
                    label="基本信息" 
                    active={activeTab === 'general'} 
                    onClick={() => handleTabChange('general')} 
                  />
                  <TabItem 
                    icon={<Shield />} 
                    label="账户安全" 
                    active={activeTab === 'security'} 
                    onClick={() => handleTabChange('security')} 
                  />
                  <TabItem 
                    icon={<CreditCard />} 
                    label="支付和订单" 
                    active={activeTab === 'billing'} 
                    onClick={() => handleTabChange('billing')} 
                  />
                  <TabItem 
                    icon={<Bell />} 
                    label="通知偏好" 
                    active={activeTab === 'notifications'} 
                    onClick={() => handleTabChange('notifications')} 
                  />
              </nav>
              
              {/* 退出登录按钮 */}
              <div className="mt-auto pt-6 border-t border-white/5">
                  <button
                      onClick={handleLogout}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 px-4 py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                      <LogOut className="w-4 h-4" />
                      退出登录
                  </button>
              </div>
          </aside>

          {/* === Content Area === */}
          <main className="flex-1 overflow-y-auto relative bg-gradient-to-br from-transparent to-black/30 p-8 md:p-12 custom-scrollbar pb-28">
              
              <div className="max-w-3xl mx-auto">
                  {/* Header (No Button) */}
                  <div className="flex items-center justify-between mb-8">
                      <div>
                          <h1 className="text-3xl font-bold text-white tracking-tight">
                              {activeTab === 'general' && '基本信息'}
                              {activeTab === 'security' && '账户安全'}
                              {activeTab === 'billing' && '支付和订单'}
                              {activeTab === 'notifications' && '通知偏好'}
                          </h1>
                          <p className="text-[#86868b] mt-2 text-sm">
                              {activeTab === 'general' && '管理您的个人档案和会员权益。'}
                              {activeTab === 'security' && '监控密码强度并保护账户安全。'}
                              {activeTab === 'billing' && '充值余额及查看历史订单状态。'}
                              {activeTab === 'notifications' && '定制您的消息接收方式。'}
                          </p>
                      </div>
                  </div>

                  {/* --- Tab Content: General --- */}
                  {activeTab === 'general' && (
                      <div className="space-y-8 animate-fade-in">
                          
                          {/* Membership Card (Optimized & Simplified) */}
                          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#151516] to-[#000] border border-white/10 p-8 shadow-2xl group h-56 flex flex-col justify-between">

                              {/* Background Effects */}
                              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                              <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#0071e3] rounded-full blur-[90px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0071e3]/10 to-transparent opacity-50"></div>
                              
                              {/* Header: Logo & Chip */}
                              <div className="relative z-10 flex justify-between items-start">
                                  <div className="flex items-center gap-2 text-[#0071e3]">
                                      <Crown className="w-6 h-6 fill-current" />
                                      <span className="text-sm font-bold tracking-[0.2em] uppercase text-white/80">iBookStore VIP</span>
                                  </div>
                                  {/* Decorative Chip */}
                                  <div className="w-12 h-9 rounded-md bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                                       <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40"></div>
                                       <div className="w-8 h-6 border border-white/20 rounded-[2px] bg-transparent opacity-50"></div>
                                  </div>
                              </div>

                              {/* Footer: Level & ID */}
                              <div className="relative z-10">
                                  <h3 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">{userData.level}</h3>
                                  <p className="text-sm text-[#86868b] mt-2 font-mono tracking-widest opacity-80">
                                      NO. {formatMembershipNumber(getMembershipNumber(userData.id))}
                                  </p>
                              </div>
                          </div>

                          {/* Personal Info */}
                          <div className="space-y-6">
                              <h3 className="text-sm font-bold text-[#86868b] uppercase tracking-wider border-b border-white/5 pb-2 mt-4">个人资料</h3>
                              <InputGroup label="姓名" value={formData.full_name} onChange={(v: string) => setFormData({...formData, full_name: v})} icon={<User className="w-4 h-4" />} />
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <InputGroup label="电子邮箱" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} icon={<Mail className="w-4 h-4" />} type="email" />
                                  <InputGroup label="手机号码" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} icon={<Phone className="w-4 h-4" />} type="tel" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <InputGroup label="详细地址" value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} icon={<MapPin className="w-4 h-4" />} />
                                  <InputGroup 
                                    label="头像 URL" 
                                    value={formData.avatarUrl} 
                                    onChange={(v: string) => setFormData({...formData, avatarUrl: v})} 
                                    icon={<Link className="w-4 h-4" />} 
                                    placeholder="输入图片链接..."
                                  />
                              </div>
                              
                              {/* 保存基本信息按钮 */}
                              <button
                                  onClick={handleSave}
                                  disabled={isLoading}
                                  className="w-full bg-[#0071e3] hover:bg-[#0062c3] disabled:bg-[#3a3a3c] disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors active:scale-95 flex items-center justify-center gap-2 mt-4"
                              >
                                  {isLoading ? (
                                      <>
                                          <Loader2 className="w-5 h-5 animate-spin" />
                                          保存中...
                                      </>
                                  ) : (
                                      <>
                                          <Save className="w-5 h-5" />
                                          保存个人信息
                                      </>
                                  )}
                              </button>
                          </div>
                      </div>
                  )}

                  {/* --- Tab Content: Security --- */}
                  {activeTab === 'security' && (
                      <div className="space-y-8 animate-fade-in">
                          {/* Password Strength Card */}
                          <div className="p-6 rounded-3xl bg-[#2c2c2e]/30 border border-white/5 flex flex-col gap-4">
                              <div className="flex items-center gap-3">
                                  <div className={`p-2.5 rounded-full ${strength === 3 ? 'bg-green-500/10 text-green-500' : strength === 2 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'} transition-colors`}>
                                      <Lock className="w-5 h-5" />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-white text-base">密码强度检测</h3>
                                      <p className="text-xs text-[#86868b]">建议使用包含字母、数字及符号的组合。</p>
                                  </div>
                              </div>
                              
                              {/* Strength Meter */}
                              <div className="flex gap-2 h-1.5 mt-1">
                                  <div className={`flex-1 rounded-full transition-colors duration-300 ${currentPassword.length > 0 ? (strength >= 1 ? 'bg-red-500' : 'bg-red-500') : 'bg-white/10'}`}></div>
                                  <div className={`flex-1 rounded-full transition-colors duration-300 ${strength >= 2 ? 'bg-yellow-500' : 'bg-white/10'}`}></div>
                                  <div className={`flex-1 rounded-full transition-colors duration-300 ${strength >= 3 ? 'bg-green-500' : 'bg-white/10'}`}></div>
                              </div>
                              <div className="text-right text-xs font-medium">
                                  {currentPassword.length === 0 ? <span className="text-[#86868b]">未设置</span> : 
                                   strength === 3 ? <span className="text-green-500">强</span> : 
                                   strength === 2 ? <span className="text-yellow-500">中</span> : 
                                   <span className="text-red-500">弱</span>}
                              </div>
                          </div>

                          <div className="space-y-6">
                              <h3 className="text-sm font-bold text-[#86868b] uppercase tracking-wider border-b border-white/5 pb-2">密码管理</h3>
                              <div className="space-y-4">
                                  {/* 当前密码（只读，可显示/隐藏） */}
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider ml-1">当前密码</label>
                                      <div className="relative group">
                                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] w-4 h-4" />
                                          <input 
                                              type={showPassword ? "text" : "password"}
                                              value={currentPassword}
                                              readOnly
                                              className="w-full bg-[#1c1c1e]/40 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-sm text-white focus:border-[#0071e3] focus:bg-[#1c1c1e] transition-all outline-none cursor-not-allowed opacity-70"
                                          />
                                          <button
                                              type="button"
                                              onClick={() => setShowPassword(!showPassword)}
                                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white transition-colors"
                                          >
                                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                          </button>
                                      </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <InputGroup 
                                        label="新密码" 
                                        type="password" 
                                        placeholder="输入新密码" 
                                        value={newPassword}
                                        onChange={(v: string) => setNewPassword(v)}
                                      />
                                      <InputGroup 
                                        label="确认新密码" 
                                        type="password" 
                                        placeholder="再次输入" 
                                        value={confirmPassword}
                                        onChange={(v: string) => setConfirmPassword(v)}
                                      />
                                  </div>
                                  
                                  {/* 保存密码按钮 */}
                                  <button
                                      onClick={handlePasswordSave}
                                      disabled={isSavingPassword || !newPassword || !confirmPassword}
                                      className="w-full bg-[#0071e3] hover:bg-[#0062c3] disabled:bg-[#3a3a3c] disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors active:scale-95 flex items-center justify-center gap-2"
                                  >
                                      {isSavingPassword ? (
                                          <>
                                              <Loader2 className="w-5 h-5 animate-spin" />
                                              保存中...
                                          </>
                                      ) : (
                                          <>
                                              <Save className="w-5 h-5" />
                                              保存密码修改
                                          </>
                                      )}
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* --- Tab Content: Billing (Payment & Orders) --- */}
                  {activeTab === 'billing' && (
                      <div className="space-y-8 animate-fade-in">
                          
                          {/* Wallet & Top Up Section */}
                          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0a0a0c] to-[#1c1c1e] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-[#0071e3]/10 to-transparent pointer-events-none"></div>
                              
                              <div className="flex items-center gap-5 w-full md:w-auto relative z-10">
                                  <div className="w-14 h-14 rounded-2xl bg-[#0071e3] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                      <Wallet className="w-7 h-7" />
                                  </div>
                                  <div>
                                      <div className="text-xs text-[#86868b] uppercase tracking-wider mb-1">我的钱包余额</div>
                                      <div className="text-3xl font-bold text-white tracking-tight">¥{userData.balance.toFixed(2)}</div>
                                  </div>
                              </div>
                              <button 
                                onClick={() => setIsTopUpOpen(true)}
                                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg active:scale-95 relative z-10"
                              >
                                  <Plus className="w-4 h-4" /> 立即充值
                              </button>
                          </div>

                          {/* Order History Table */}
                          <div className="space-y-4">
                              <h3 className="text-sm font-bold text-[#86868b] uppercase tracking-wider border-b border-white/5 pb-2 mt-4">历史订单状态</h3>
                              
                              <div className="bg-[#1c1c1e]/40 border border-white/5 rounded-2xl overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                      <thead>
                                          <tr className="border-b border-white/5 text-xs text-[#86868b]">
                                              <th className="p-4 pl-6 font-medium uppercase">订单号</th>
                                              <th className="p-4 font-medium uppercase">内容</th>
                                              <th className="p-4 font-medium uppercase text-center">数量</th>
                                              <th className="p-4 font-medium uppercase">金额</th>
                                              <th className="p-4 font-medium uppercase">状态</th>
                                              <th className="p-4 font-medium uppercase text-right pr-6">操作</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                          {orders.length > 0 ? (
                                              orders.map((order) => (
                                                  <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                                                      <td className="p-4 pl-6">
                                                          <div className="font-mono text-xs text-[#0071e3] bg-[#0071e3]/10 px-2 py-1 rounded w-fit">
                                                              #{order.id}
                                                          </div>
                                                          <div className="text-xs text-[#86868b] mt-1">
                                                              {new Date(order.date * 1000).toLocaleDateString('zh-CN')}
                                                          </div>
                                                      </td>
                                                      <td className="p-4">
                                                          <div className="text-sm text-white line-clamp-1">{order.title || '未知图书'}</div>
                                                      </td>
                                                      <td className="p-4 text-center">
                                                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-sm font-medium text-white">
                                                              {order.quantity || 1}
                                                          </div>
                                                      </td>
                                                      <td className="p-4 text-sm font-medium text-white">¥{(order.price || 0).toFixed(2)}</td>
                                                      <td className="p-4">
                                                          <OrderStatusBadge status={order.status || '未知'} />
                                                      </td>
                                                      <td className="p-4 text-right pr-6">
                                                          {/* 取消按顲：仅在"待补货"和"待出库"时显示 */}
                                                          {(order.status === '待出库' || order.status === '待补货') ? (
                                                              <button 
                                                                  onClick={() => handleCancelOrder(order.id, order.status)}
                                                                  disabled={isCancellingOrder === order.id}
                                                                  className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto"
                                                              >
                                                                  {isCancellingOrder === order.id ? (
                                                                      <>
                                                                          <Loader2 className="w-3 h-3 animate-spin" />
                                                                          取消中...
                                                                      </>
                                                                  ) : (
                                                                      '取消订单'
                                                                  )}
                                                              </button>
                                                          ) : (
                                                              <span className="text-xs text-[#86868b]">—</span>
                                                          )}
                                                      </td>
                                                  </tr>
                                              ))
                                          ) : (
                                              <tr>
                                                  <td colSpan={6} className="p-8 text-center text-[#86868b] text-sm">
                                                      暂无订单记录
                                                  </td>
                                              </tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* --- Tab Content: Notifications --- */}
                  {activeTab === 'notifications' && (
                      <div className="space-y-8 animate-fade-in">
                          <div className="space-y-6">
                              <h3 className="text-sm font-bold text-[#86868b] uppercase tracking-wider border-b border-white/5 pb-2">邮件通知</h3>
                              <ToggleItem title="新书上架提醒" desc="当您关注的分类有新书时通知您。" />
                              <ToggleItem title="订单状态更新" desc="发货、派送及签收的实时通知。" />
                              <ToggleItem title="每周精选周报" desc="每周五发送经过 AI 筛选的书单。" />
                          </div>

                          <div className="space-y-6">
                              <h3 className="text-sm font-bold text-[#86868b] uppercase tracking-wider border-b border-white/5 pb-2 mt-8">App 推送</h3>
                              <ToggleItem title="降价提醒" desc="您收藏的图书降价时提醒。"  />
                              <ToggleItem title="账户安全警报" desc="检测到异常登录时立即通知。" />
                          </div>
                      </div>
                  )}

              </div>
          </main>

      </div>

      {/* --- Top Up Modal --- */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsTopUpOpen(false)}></div>
            <div className="relative w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up transform transition-all">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white">充值余额</h3>
                    <button onClick={() => setIsTopUpOpen(false)} className="text-[#86868b] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleTopUpSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">充值金额 (CNY)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg">¥</span>
                            <input 
                                type="number" 
                                min="0.01" 
                                step="0.01"
                                value={topUpAmount} 
                                onChange={(e) => setTopUpAmount(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-white focus:border-[#0071e3] outline-none transition-colors placeholder:text-white/10" 
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        {[50, 100, 500].map(amt => (
                            <button 
                                key={amt}
                                type="button"
                                onClick={() => setTopUpAmount(amt.toString())}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-colors"
                            >
                                ¥{amt}
                            </button>
                        ))}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isToppingUp}
                        className="w-full py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0062c3] text-white transition-colors font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isToppingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                        确认支付
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.05; transform: scale(1); }
          100% { opacity: 0.1; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

// --- Sub Components ---

function TabItem({ icon, label, active, onClick }: { icon: React.ReactElement; label: string; active: boolean; onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-sm font-medium
                ${active 
                    ? 'bg-[#0071e3]/10 text-white shadow-[0_0_20px_rgba(0,113,227,0.1)] border border-[#0071e3]/20' 
                    : 'text-[#86868b] hover:bg-white/5 hover:text-white border border-transparent'}
            `}
        >
            {React.cloneElement(icon as React.ReactElement<any>, { className: `w-4 h-4 ${active ? 'text-[#0071e3]' : 'text-[#86868b] group-hover:text-white'}` })}
            {label}
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0071e3]" />}
        </button>
    );
}

function InputGroup({ label, value, onChange, icon, type = "text", placeholder }: { label: string; value?: string; onChange?: (value: string) => void; icon?: React.ReactElement; type?: string; placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider ml-1">{label}</label>
            <div className="relative group">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors">{icon}</div>}
                <input 
                    type={type}
                    value={value}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full bg-[#1c1c1e]/40 border border-white/10 rounded-xl py-3 text-sm text-white focus:border-[#0071e3] focus:bg-[#1c1c1e] transition-all outline-none placeholder:text-[#515154] ${icon ? 'pl-11 pr-4' : 'px-4'}`}
                />
            </div>
        </div>
    );
}

function SelectGroup({ label, value, options, icon }: { label: string; value?: string; options: string[]; icon?: React.ReactElement }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider ml-1">{label}</label>
            <div className="relative group">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors">{icon}</div>}
                <select 
                    className={`w-full bg-[#1c1c1e]/40 border border-white/10 rounded-xl py-3 text-sm text-white focus:border-[#0071e3] focus:bg-[#1c1c1e] transition-all outline-none appearance-none ${icon ? 'pl-11 pr-10' : 'px-4'}`}
                    value={value}
                    onChange={() => {}}
                >
                    {options.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ title, desc, defaultChecked }: { title: string; desc: string; defaultChecked?: boolean }) {
    const [checked, setChecked] = useState(defaultChecked || false);
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#2c2c2e]/20 border border-white/5 hover:border-white/10 transition-colors">
            <div className="pr-4">
                <h4 className="text-sm font-medium text-white">{title}</h4>
                <p className="text-xs text-[#86868b] mt-0.5">{desc}</p>
            </div>
            <button 
                onClick={() => setChecked(!checked)}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 relative ${checked ? 'bg-[#0071e3]' : 'bg-[#3a3a3c]'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    let colorClass = "";
    let icon = null;
    
    switch (status) {
        case "已完成": 
            colorClass = "text-green-500 bg-green-500/10 border-green-500/20";
            icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
            break;
        case "派送中":
            colorClass = "text-blue-500 bg-blue-500/10 border-blue-500/20";
            icon = <Truck className="w-3 h-3 mr-1" />;
            break;
        case "待出库":
            colorClass = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
            icon = <Package className="w-3 h-3 mr-1" />;
            break;
        case "待补货":
            colorClass = "text-orange-500 bg-orange-500/10 border-orange-500/20";
            icon = <Clock className="w-3 h-3 mr-1" />;
            break;
        case "已取消":
            colorClass = "text-red-500 bg-red-500/10 border-red-500/20";
            icon = <X className="w-3 h-3 mr-1" />;
            break;
        default:
            colorClass = "text-gray-500 bg-gray-500/10 border-gray-500/20";
            icon = <AlertCircle className="w-3 h-3 mr-1" />;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${colorClass}`}>
            {icon}
            {status}
        </span>
    );
}