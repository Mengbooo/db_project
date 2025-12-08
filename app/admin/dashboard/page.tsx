"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  LayoutDashboard, 
  BookOpen, 
  ShoppingBag, 
  Users, 
  Truck, 
  Settings, 
  LogOut, 
  Plus, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ShoppingCart,
  X,
  Save,
  Bell,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  profile_address: string;
  balance: number;
  creditLevel: number;
  avatar_url: string | null;
  role: string;
}

interface DisplayUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  creditLevel: number;
  joined: string;
  status: string;
  phone?: string;
  profile_address?: string;
  balance?: number;
  role: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  stock: number;
  category: string;
  status: string;
  publisher?: string;
  supplier?: string;
  publishDate?: string;
  seriesNo?: number;
}

interface Order {
  id: string;
  bookId?: number; // 书签 ID
  bookTitle?: string; // 书名
  supplier?: string; // 供应商
  supplierEmail?: string; // 供应商邮箱
  quantity: number; // 数量
  status: string;
  // 以下为纳入争章的旧字段（可保或不用）
  customer?: string;
  date?: string;
  total?: number;
  items?: number;
  shippingAddress?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  category: string;
  region: string;
  phone?: string;
  website?: string;
}

type EditingItem = User | Book | Order | Supplier | null;

// Mock数据已移除，使用数据库数据

const INITIAL_BOOKS: Book[] = [
  { id: 101, title: "The Art of Code", author: "Max Howell", price: 89.00, stock: 124, category: "技术", status: "In Stock" },
  { id: 102, title: "Minimalist Living", author: "Fumio Sasaki", price: 45.00, stock: 45, category: "生活", status: "Low Stock" },
  { id: 103, title: "Designing Interfaces", author: "Jenifer Tidwell", price: 128.00, stock: 89, category: "设计", status: "In Stock" },
  { id: 104, title: "Steve Jobs", author: "Walter Isaacson", price: 68.00, stock: 0, category: "传记", status: "Out of Stock" },
  { id: 105, title: "Neuromancer", author: "William Gibson", price: 56.00, stock: 210, category: "科幻", status: "In Stock" },
];

const INITIAL_ORDERS: Order[] = [
  { id: "ORD-7728", bookTitle: "计算机网络", supplier: "清华供应商", supplierEmail: "contact@tsinghua.edu.cn", quantity: 20, status: "Completed", customer: "Alex Chen", date: "2023-10-24", total: 189.00, items: 3 },
  { id: "ORD-7729", bookTitle: "数据库系统概念", supplier: "機工供应商", supplierEmail: "contact@cip.com.cn", quantity: 15, status: "Processing", customer: "Sarah Smith", date: "2023-10-24", total: 45.00, items: 1 },
  { id: "ORD-7730", bookTitle: "深入理解计算机系统", supplier: "人邮供应商", supplierEmail: "contact@ptpress.com.cn", quantity: 10, status: "Pending", customer: "Mike Jones", date: "2023-10-23", total: 256.00, items: 4 },
  { id: "ORD-7731", bookTitle: "算法导论", supplier: "機工供应商", supplierEmail: "contact@cip.com.cn", quantity: 8, status: "Cancelled", customer: "Emily Yu", date: "2023-10-23", total: 89.00, items: 1 },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: "SUP-01", name: "Penguin Random House", email: "contact@penguin.com", category: "Publishing", region: "Global" },
  { id: "SUP-02", name: "O'Reilly Media", email: "support@oreilly.com", category: "Tech Edu", region: "USA" },
  { id: "SUP-03", name: "Kinokuniya", email: "sales@kinokuniya.jp", category: "Retail", region: "Japan" },
];

const MOCK_ADMIN = {
    name: "Sarah Admin",
    role: "Super Admin",
    email: "sarah@ibookstore.com",
    avatar: "SA"
};

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

// 修改AdminDashboard组件以接收props
export default function AdminDashboard({ searchParams }: { searchParams: Promise<{ adminId?: string; tab?: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'books' | 'orders' | 'users' | 'suppliers' | 'shortage'>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const [shortageSearchQuery, setShortageSearchQuery] = useState(''); // 专用于缺书书籍搜索
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState(''); // 专用于采购单搜索
  
  // Data State
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<User | null>(null); // 添加admin数据状态
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem>(null);
  
  // Restock Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItemId, setRestockItemId] = useState<number | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(10);
  
  // Quick Purchase Modal State
  const [isQuickPurchaseModalOpen, setIsQuickPurchaseModalOpen] = useState(false);
  const [quickPurchaseBookId, setQuickPurchaseBookId] = useState<number | null>(null);
  const [quickPurchaseQuantity, setQuickPurchaseQuantity] = useState(1);
  
  // Supplier Notification State
  const [notificationSupplier, setNotificationSupplier] = useState<string | null>(null);

  // 退出登录函数
  const handleLogout = () => {
    toast.success('退出登录成功');
    // 清除本地存储的用户信息
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminId');
    // 跳转到登录页面
    router.push('/auth');
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取admin ID和tab参数
        const params = await searchParams;
        const adminId = params.adminId || '1'; // 默认ID为1
        const tabParam = params.tab as 'books' | 'orders' | 'users' | 'suppliers' | undefined;
        
        // 如果URL中有tab参数，设置为当前tab
        if (tabParam && ['books', 'orders', 'users', 'suppliers'].includes(tabParam)) {
          setActiveTab(tabParam);
        }
        
        // 获取admin dashboard数据
        const response = await fetch(`/api/admin?adminId=${adminId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch admin dashboard data');
        }
        
        const data = await response.json();
        setBooks(data.books);
        setOrders(data.orders);
        setPurchaseOrders(data.purchaseOrders || []);
        setUsers(data.users);
        setSuppliers(data.suppliers);
        
        // 设置admin数据
        if (data.admin) {
          setAdminData(data.admin);
        }
      } catch (err) {
        console.error('获取数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 切换 tab 并更新 URL
  const handleTabChange = async (tab: 'books' | 'orders' | 'users' | 'suppliers' | 'shortage') => {
    setActiveTab(tab);
    
    // 获取当前的 adminId
    const params = await searchParams;
    const adminId = params.adminId || '1';
    
    // 更新 URL，保留 adminId 参数
    router.push(`/admin/dashboard?adminId=${adminId}&tab=${tab}`);
  };

  // --- Actions ---
  const handleDelete = async (id: string | number, type: string) => {
    if (type === 'books') {
      try {
        // 发送删除请求到API
        const response = await fetch(`/api/books/delete/${id}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          toast.success("图书已删除");
        } else {
          toast.error(`删除失败: ${result.message}`);
        }
      } catch (error) {
        console.error('删除图书时出错:', error);
        toast.error('删除图书时发生错误');
      }
    } else if (type === 'suppliers') {
      try {
        // 提取数字的 ID
        const supplierId = (id as string).replace('SUP-', '');
        // 发送刪除请求到API
        const response = await fetch(`/api/suppliers/delete?id=${supplierId}`, {
          method: 'DELETE',
        });
            
        const result = await response.json();
            
        if (result.success) {
          // 刷新数据
          await refreshData();
          toast.success('供应商已刪除');
        } else {
          toast.error(`刪除失败: ${result.message}`);
        }
      } catch (error) {
        console.error('删除供应商时出错:', error);
        toast.error('删除供应商时发生错误');
      }
    } else if (type === 'users') {
      try {
        // 用户ID直接是数字，不需要转换
        // 发送删除请求到API
        const response = await fetch(`/api/users/delete/${id}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          toast.success('用户已删除');
        } else {
          toast.error(`删除失败: ${result.message}`);
        }
      } catch (error) {
        console.error('删除用户时出错:', error);
        toast.error('删除用户时发生错误');
      }
    } else if (type === 'orders') {
      // 订单删除逻辑 - 仅允许删除已送达和已取消的订单
      // 查找订单对象以检查状态
      const order = orders.find(o => o.id === id);
      
      if (!order) {
        toast.error('订单不存在');
        return;
      }
      
      // 检查订单状态
      if (order.status !== '已送达' && order.status !== '已取消') {
        toast.error(`无法删除状态为“${order.status}”的订单，只能删除“已送达”或“已取消”的订单`);
        return;
      }
      
      try {
        // 从订单ID中提取数字 (ORD-0001 -> 1)
        const orderId = (id as string).replace('ORD-', '');
        
        // 发送删除请求到API
        const response = await fetch(`/api/orders/delete/${orderId}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          toast.success('订单已删除');
        } else {
          toast.error(`删除失败: ${result.message}`);
        }
      } catch (error) {
        console.error('删除订单时出错:', error);
        toast.error('删除订单时发生错误');
      }
    } else if (type === 'purchaseOrders') {
      // 采购单删除逻辑 - 仅允许删除已完成和已取消的采购单
      // 查找采购单对象以检查状态
      const purchaseOrder = purchaseOrders.find(o => o.id === id);
      
      if (!purchaseOrder) {
        toast.error('采购单不存在');
        return;
      }
      
      // 检查采购单状态
      if (purchaseOrder.status !== '已完成' && purchaseOrder.status !== '已取消') {
        toast.error(`无法删除状态为"${purchaseOrder.status}"的采购单，只能删除"已完成"或"已取消"的采购单`);
        return;
      }
      
      try {
        // 发送删除请求到API
        const response = await fetch(`/api/purchase-orders/delete/${id}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          toast.success('采购单已删除');
        } else {
          toast.error(`删除失败: ${result.message}`);
        }
      } catch (error) {
        console.error('删除采购单时出错:', error);
        toast.error('删除采购单时发生错误');
      }
    } else {
      // 其他类型的删除保持原有逻辑
      toast.success('记录已删除');
    }
  };

  const handleEdit = (item: User | Book | Order | Supplier) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null); // Null means adding new
    setIsModalOpen(true);
  };

  const refreshData = async () => {
    try {
      // 获取URL中的adminId参数
      const urlParams = new URLSearchParams(window.location.search);
      const adminId = urlParams.get('adminId') || '1'; // 默认ID为1
      
      // 获取admin dashboard数据
      const response = await fetch(`/api/admin?adminId=${adminId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch admin dashboard data');
      }
      
      const data = await response.json();
      setBooks(data.books);
      setOrders(data.orders);
      setPurchaseOrders(data.purchaseOrders || []);
      setUsers(data.users);
      setSuppliers(data.suppliers);
      
      // 设置admin数据
      if (data.admin) {
        setAdminData(data.admin);
      }
    } catch (err) {
      console.error('刷新数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'books' && editingItem) {
      // 图书编辑逻辑
      const formData = new FormData(e.target as HTMLFormElement);
      const authorInput = formData.get('author') as string;
      
      // 验证作者数量
      if (authorInput) {
        const authors = authorInput.split(/[,，]/).map(a => a.trim()).filter(a => a);
        if (authors.length > 4) {
          toast.error('每本图书最多只能有4个作者，请用逗号分隔');
          return;
        }
      }
      
      const bookData = {
        id: (editingItem as Book).id,
        name: formData.get('title') as string,
        author: authorInput,
        price: parseFloat(formData.get('price') as string),
        publisher: formData.get('publisher') as string,
        supplier: formData.get('supplier') as string,
        stock: parseInt(formData.get('stock') as string),
        keyword: formData.get('category') as string,
        seriesNo: parseInt(formData.get('seriesNo') as string) || 0
      };
      
      // 验证库存不能为负数
      if (bookData.stock < 0) {
        toast.error('库存数量不能低于0');
        return;
      }
      
      try {
        // 发送更新请求到API
        const response = await fetch('/api/books/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookData),
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          setIsModalOpen(false);
          toast.success('图书信息更新成功');
        } else {
          toast.error(`更新失败: ${result.message}`);
        }
      } catch (error) {
        console.error('更新图书信息时出错:', error);
        toast.error('更新图书信息时发生错误');
      }
    } else if (activeTab === 'suppliers' && editingItem) {
      // 供应商编辑逻辑
      const formData = new FormData(e.target as HTMLFormElement);
      const supplierData = {
        id: (editingItem as Supplier).id.replace('SUP-', ''),
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        category: formData.get('category') as string,
        region: formData.get('region') as string,
        website: formData.get('website') as string
      };
      
      try {
        // 发送更新请求到API
        const response = await fetch('/api/suppliers/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(supplierData),
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          setIsModalOpen(false);
          toast.success('供应商信息更新成功');
        } else {
          toast.error(`更新失败: ${result.message}`);
        }
      } catch (error) {
        console.error('更新供应商信息时出错:', error);
        toast.error('更新供应商信息时发生错误');
      }
    } else if (activeTab === 'users' && editingItem) {
      // 用户编辑逻辑
      const formData = new FormData(e.target as HTMLFormElement);
      const userData = {
        id: (editingItem as User).id,
        full_name: formData.get('full_name') as string,
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        creditLevel: parseInt(formData.get('creditLevel') as string),
        balance: parseFloat(formData.get('balance') as string)
      };
      
      try {
        // 发送更新请求到API
        const response = await fetch('/api/users/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          setIsModalOpen(false);
          toast.success('用户信息更新成功');
        } else {
          toast.error(`更新失败: ${result.message}`);
        }
      } catch (error) {
        console.error('更新用户信息时出错:', error);
        toast.error('更新用户信息时发生错误');
      }
    } else if (activeTab === 'orders' && editingItem) {
      // 订单编辑逻辑（仅更新状态）
      const formData = new FormData(e.target as HTMLFormElement);
      const orderData = {
        orderId: (editingItem as Order).id,
        status: formData.get('status') as string
      };
      
      try {
        // 发送更新请求到API
        const response = await fetch('/api/orders/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          setIsModalOpen(false);
          toast.success('订单状态更新成功');
        } else {
          toast.error(`更新失败: ${result.message}`);
        }
      } catch (error) {
        console.error('更新订单时出错:', error);
        toast.error('更新订单时发生错误');
      }
    } else if (activeTab === 'shortage' && editingItem) {
      // 采购单编辑逻辑（仅更新状态和数量）
      const formData = new FormData(e.target as HTMLFormElement);
      const currentStatus = editingItem && 'status' in editingItem ? (editingItem.status as string) : '待处理';
      const newStatus = formData.get('status') as string;
      let quantity = parseInt(formData.get('quantity') as string) || (editingItem && 'quantity' in editingItem ? editingItem.quantity : 0);
      
      // 仅待处理状态可修改数量，其他状态只保持原数量
      if (currentStatus !== '待处理') {
        quantity = editingItem && 'quantity' in editingItem ? (editingItem.quantity as number) : 0;
      }
      
      const purchaseData = {
        id: (editingItem as Order).id,
        quantity: quantity,
        status: newStatus
      };
      
      try {
        // 发送更新请求到API
        const response = await fetch('/api/purchase-orders/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(purchaseData),
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 刷新数据
          await refreshData();
          setIsModalOpen(false);
          toast.success('采购单已更新');
        } else {
          toast.error(`更新失败: ${result.message}`);
        }
      } catch (error) {
        console.error('更新采购单时出错:', error);
        toast.error('更新采购单时发生错误');
      }
    } else if (!editingItem) {
      // 添加新条目的逻辑
      if (activeTab === 'books') {
        // 获取表单数据
        const formData = new FormData(e.target as HTMLFormElement);
        const authorInput = formData.get('author') as string || '';
        
        // 验证作者数量
        if (authorInput) {
          const authors = authorInput.split(/[,，]/).map(a => a.trim()).filter(a => a);
          if (authors.length > 4) {
            toast.error('每本图书最多只能有4个作者，请用逗号分隔');
            return;
          }
        }
        
        const bookData = {
          name: formData.get('title') as string || 'New Book Title',
          author: authorInput,
          price: parseFloat(formData.get('price') as string) || 0,
          publisher: formData.get('publisher') as string || 'Unknown Publisher',
          supplier: formData.get('supplier') as string || 'Unknown Supplier',
          stock: parseInt(formData.get('stock') as string) || 0,
          keyword: formData.get('category') as string || 'Uncategorized',
          seriesNo: parseInt(formData.get('seriesNo') as string) || 0
        };
        
        // 验证库存不能为负数
        if (bookData.stock < 0) {
          toast.error('库存数量不能低于0');
          return;
        }
        
        try {
          // 发送新增请求到API
          const response = await fetch('/api/books/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookData),
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 刷新数据
            await refreshData();
            setIsModalOpen(false);
            toast.success('新图书已添加');
          } else {
            toast.error(`添加失败: ${result.message}`);
          }
        } catch (error) {
          console.error('添加图书时出错:', error);
          toast.error('添加图书时发生错误');
        }
      } else if (activeTab === 'suppliers') {
        // 供应商新增逻辑
        const formData = new FormData(e.target as HTMLFormElement);
        const supplierData = {
          name: formData.get('name') as string || '新供应商',
          email: formData.get('email') as string || '',
          phone: formData.get('phone') as string || '',
          category: formData.get('category') as string || '',
          region: formData.get('region') as string || '中国',
          website: formData.get('website') as string || ''
        };
        
        try {
          // 发送新增请求到API
          const response = await fetch('/api/suppliers/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(supplierData),
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 刷新数据
            await refreshData();
            setIsModalOpen(false);
            toast.success('新供应商已添加');
          } else {
            toast.error(`添加失败: ${result.message}`);
          }
        } catch (error) {
          console.error('添加供应商时出错:', error);
          toast.error('添加供应商时发生错误');
        }
      } else if (activeTab === 'users') {
        // 用户新增逻辑
        const formData = new FormData(e.target as HTMLFormElement);
        const userData = {
          full_name: formData.get('full_name') as string || '新用户',
          username: formData.get('username') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string || '123456',
          phone: formData.get('phone') as string || '',
          address: formData.get('address') as string || '',
          creditLevel: parseInt(formData.get('creditLevel') as string) || 1,
          balance: parseFloat(formData.get('balance') as string) || 0
        };
        
        // 验证必需字段
        if (!userData.username || !userData.email) {
          toast.error('用户名和邮箱是必需的');
          return;
        }
        
        try {
          // 发送新增请求到API
          const response = await fetch('/api/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 刷新数据
            await refreshData();
            setIsModalOpen(false);
            toast.success('新用户已添加');
          } else {
            toast.error(`添加失败: ${result.message}`);
          }
        } catch (error) {
          console.error('添加用户时出错:', error);
          toast.error('添加用户时发生错误');
        }
      } else if (activeTab === 'shortage' && !editingItem) {
        // 采购单新增逻辑
        const formData = new FormData(e.target as HTMLFormElement);
        const bookId = parseInt(formData.get('book_id') as string);
        const quantity = parseInt(formData.get('quantity') as string);
        
        // 验证下单需求的汰
        if (!bookId || bookId <= 0) {
          toast.error('请选择一个有效的图书');
          return;
        }
        
        if (!quantity || quantity <= 0) {
          toast.error('请输入有效的采购数量');
          return;
        }
        
        try {
          // 发送新增请求到API
          const response = await fetch('/api/purchase-orders/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              book_id: bookId,
              quantity: quantity
            }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 刷新数据
            await refreshData();
            setIsModalOpen(false);
            toast.success('新采购单已创建');
          } else {
            toast.error(`添加失败: ${result.message}`);
          }
        } catch (error) {
          console.error('创建采购单时出错:', error);
          toast.error('创建采购单时发生错误');
        }
      } else {
        // 其他条件 tab 的保存逻辑（保持原有 mock 逻辑）
        setIsModalOpen(false);
        toast.success("修改已保存 (Mock)");
      }
    } else {
      // 编辑或其他接 tab 的保存逻辑（保持原有 mock 逻辑）
      setIsModalOpen(false);
      toast.success("修改已保存 (Mock)");
    }
  };

  const handleNotifyRestock = (supplierId: string, supplierName: string, supplierEmail: string) => {
    // 模拟通知补货
    setNotificationSupplier(supplierId);
    toast.success(`已通知${supplierName} (${supplierEmail}) 补货`);
    
    // 2秒后清除通知状态
    setTimeout(() => {
      setNotificationSupplier(null);
    }, 2000);
  };

  // 联系供应商函数
  const handleContactSupplier = async (orderId: string, supplierName: string, supplierEmail: string, currentStatus: string) => {
    // 如果是“待处理”状态，更新为“已完成”
    if (currentStatus === '待处理') {
      try {
        const response = await fetch('/api/purchase-orders/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: orderId,
            quantity: -1, // 文件字段不修改，空値表示不修改
            status: '已完成'
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          await refreshData();
          toast.success(`已联系供应商${supplierName}补货`, {
            description: `邮箱: ${supplierEmail}`,
            duration: 3000,
          });
        } else {
          toast.error(`更新失败: ${result.message}`);
        }
      } catch (error) {
        console.error('联系供应商时出错:', error);
        toast.error('联系供应商时发生错误');
      }
    } else {
      // 其他状态下，空顯示提示信息
      toast.success(`已联系供应商${supplierName}补货`, {
        description: `邮箱: ${supplierEmail}`,
        duration: 3000,
      });
    }
  };

  const handleRestock = (id: number) => {
    // 设置补货弹窗的状态
    setRestockItemId(id);
    setRestockQuantity(10); // 默认补货数量为10
    setIsRestockModalOpen(true);
  };
  
  const handleRestockSubmit = async () => {
    if (!restockItemId) return;
    
    if (isNaN(restockQuantity) || restockQuantity <= 0) {
      toast.error("请输入有效的补货数量");
      return;
    }
    
    try {
      // 调用API来处理补货逻辑
      const response = await fetch('/api/books/restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: restockItemId, quantity: restockQuantity }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 刷新数据
        await refreshData();
        setIsRestockModalOpen(false);
        toast.success(`图书 ID ${restockItemId} 补货成功，库存增加${restockQuantity}本`);
      } else {
        toast.error(`补货失败: ${result.message}`);
      }
    } catch (error) {
      console.error('补货时出错:', error);
      toast.error('补货时发生错误');
    }
  };

  // --- Actions ---

  // --- Render Helpers ---
  
  // 根据当前tab和搜索查询过滤数据
  const getFilteredBooks = () => {
    return books.filter(book => 
      book.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // 缺书和采购标签页的过滤函数 - 过滤掉In Stock状态的图书
  const getFilteredShortageBooks = () => {
    return books.filter(book => 
      book.title.toLowerCase().includes(shortageSearchQuery.toLowerCase()) &&
      book.status !== 'In Stock'
    );
  };
  
  const getFilteredOrders = () => {
    return orders.filter(order => 
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // 采购单过滤函数 - 支持按订单号和书名搜索
  const getFilteredPurchaseOrders = () => {
    return purchaseOrders.filter(order => 
      order.id.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) ||
      (order.bookTitle && order.bookTitle.toLowerCase().includes(purchaseSearchQuery.toLowerCase()))
    );
  };
  
  // 检查某本书是否有采购单
  const hasPurchaseOrder = (bookId: number) => {
    return purchaseOrders.some(order => order.bookId === bookId);
  };
  
  const getFilteredUsers = () => {
    return users.filter(user => 
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };
  
  const getFilteredSuppliers = () => {
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': case 'Completed': case 'Active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Low Stock': case 'Processing': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Out of Stock': case 'Cancelled': case 'Inactive': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  // 采购单状态颜色函数
  const getPurchaseStatusColor = (status: string) => {
    switch (status) {
      case '待处理': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'; // 灰色
      case '待发货': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'; // 黄色
      case '运输中': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'; // 蓝色
      case '已完成': return 'bg-green-500/10 text-green-400 border-green-500/20'; // 绿色
      case '已取消': return 'bg-red-500/10 text-red-400 border-red-500/20'; // 红色
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
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

  return (
    <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans flex items-center justify-center selection:bg-[#0071e3] selection:text-white overflow-hidden relative p-4 md:p-8">
      <Toaster 
        position="top-center" 
        theme="dark"
        toastOptions={{
          duration: 1000,
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
      
      {/* --- Background (Smoother Animation) --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
         <div 
            className="absolute top-[-20%] right-[-10%] w-[1200px] h-[1000px] bg-[#0071e3] rounded-full blur-[300px] opacity-[0.08]"
            style={{ animation: 'pulse 15s ease-in-out infinite alternate' }} 
         ></div>
         <div 
            className="absolute bottom-[-20%] left-[-10%] w-[1000px] h-[800px] bg-[#bf5af2] rounded-full blur-[250px] opacity-[0.05]"
            style={{ animation: 'pulse 20s ease-in-out infinite alternate-reverse' }} 
         ></div>
      </div>

      {/* --- Main Glass Container (Resized to match User Dashboard) --- */}
      <div className="relative z-10 w-full max-w-[1600px] h-[90vh] md:h-[85vh] bg-[#1c1c1e]/60 backdrop-blur-3xl border border-white/[0.08] rounded-[40px] shadow-2xl overflow-hidden flex ring-1 ring-white/10">
          
          {/* === Sidebar Navigation === */}
          <aside className="w-20 lg:w-72 bg-black/20 border-r border-white/[0.05] flex flex-col justify-between py-8 z-20 backdrop-blur-md">
              <div>
                  {/* Logo Area (Removed Icon) */}
                  <div className="px-8 mb-8">
                      <span className="font-bold text-xl hidden lg:block tracking-tight text-white">
                          iBookStore <span className="font-normal text-white/50">Admin</span>
                      </span>
                      {/* Mobile Logo fallback */}
                      <span className="font-bold text-xl lg:hidden text-white">iB</span>
                  </div>

                  {/* Admin Profile Card (Aligned) */}
                  <div className="px-4 mb-8 hidden lg:block">
                      <div className="bg-[#2c2c2e]/50 border border-white/5 rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md group hover:bg-[#3a3a3c]/60 transition-colors cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0071e3] to-[#5ac8fa] p-[2px] flex-shrink-0 shadow-lg shadow-blue-500/20">
                             <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center text-xs font-bold text-white">
                                 {adminData ? (adminData.full_name || adminData.username).charAt(0) : MOCK_ADMIN.avatar}
                             </div>
                          </div>
                          <div className="overflow-hidden flex-1 min-w-0">
                              <div className="text-sm font-bold text-white truncate">{adminData ? (adminData.full_name || adminData.username) : MOCK_ADMIN.name}</div>
                              <div className="text-xs text-[#86868b] truncate flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-[#0071e3]" /> {adminData ? adminData.role : MOCK_ADMIN.role}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex flex-col gap-2 px-4">
                      <NavItem icon={<BookOpen />} label="图书管理" active={activeTab === 'books'} onClick={() => handleTabChange('books')} />
                      <NavItem icon={<ShoppingBag />} label="订单管理" active={activeTab === 'orders'} onClick={() => handleTabChange('orders')} />
                      <NavItem icon={<Users />} label="用户管理" active={activeTab === 'users'} onClick={() => handleTabChange('users')} />
                      <NavItem icon={<Truck />} label="供应商" active={activeTab === 'suppliers'} onClick={() => handleTabChange('suppliers')} />
                      <NavItem icon={<AlertCircle />} label="缺书和采购" active={activeTab === 'shortage'} onClick={() => handleTabChange('shortage')} />
                  </nav>
              </div>

              <div className="px-4">
                  <NavItem icon={<LogOut />} label="退出登录" onClick={handleLogout} active={false} />

              </div>
          </aside>

          {/* === Main Content === */}
          <main className="flex-1 flex flex-col relative bg-gradient-to-br from-transparent to-black/30">
              
              {/* Header (Removed Search) */}
              <header className="h-24 flex items-center justify-between px-8 border-b border-white/[0.05] shrink-0 bg-white/[0.01]">
                  <div className="flex flex-col">
                      <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                          {activeTab === 'books' && <><BookOpen className="w-6 h-6 text-[#0071e3]" /> 图书库</>}
                          {activeTab === 'orders' && <><ShoppingBag className="w-6 h-6 text-[#0071e3]" /> 订单中心</>}
                          {activeTab === 'users' && <><Users className="w-6 h-6 text-[#0071e3]" /> 用户列表</>}
                          {activeTab === 'suppliers' && <><Truck className="w-6 h-6 text-[#0071e3]" /> 供应商网络</>}
                          {activeTab === 'shortage' && <><AlertCircle className="w-6 h-6 text-[#0071e3]" /> 缺书和采购</>}
                      </h1>
                      <p className="text-xs text-[#86868b] mt-1 ml-8">
                          {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                  </div>

                  <div className="flex items-center gap-4">
                       <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors relative">
                          <Bell className="w-4 h-4 text-[#86868b]" />
                          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#1c1c1e]"></span>
                       </button>
                  </div>
              </header>

              {/* Data Table Area */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  
                  {/* Content Actions: Search and Add Button */}
                  {activeTab !== 'shortage' && (
                    <div className="flex items-center justify-between mb-6 gap-4">
                        <div className="relative group flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors" />
                            <input 
                                type="text" 
                                placeholder={`搜索${activeTab === 'books' ? '图书' : activeTab === 'orders' ? '订单' : activeTab === 'users' ? '用户' : '供应商'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1c1c1e]/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#0071e3] focus:bg-[#1c1c1e] transition-all outline-none placeholder:text-[#515154]"
                            />
                        </div>
                        {activeTab !== 'orders' && (
                          <button 
                            onClick={handleAddNew}
                            className="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0062c3] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 border border-transparent hover:border-white/10 whitespace-nowrap"
                          >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">新增{activeTab === 'books' ? '图书' : activeTab === 'users' ? '用户' : '条目'}</span>
                          </button>
                        )}
                    </div>
                  )}
                  
                  {/* Shortage Tab - Two Tables Layout */}
                  {activeTab === 'shortage' && (
                    <>
                      {/* Shortage Books Section */}
                      <div>
                        {/* Shortage Books Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            缺书书籍
                          </h2>
                        </div>
                        
                        {/* Shortage Books Table */}
                        <div className="bg-[#1c1c1e]/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm mb-8">
                          {/* Search Bar for Shortage Books */}
                          <div className="p-4 border-b border-white/5">
                            <div className="relative group flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors" />
                              <input 
                                  type="text" 
                                  placeholder="搜索缺书书籍..."
                                  value={shortageSearchQuery}
                                  onChange={(e) => setShortageSearchQuery(e.target.value)}
                                  className="w-full bg-[#1c1c1e]/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#0071e3] focus:bg-[#1c1c1e] transition-all outline-none placeholder:text-[#515154]"
                              />
                            </div>
                          </div>
                          
                          <table className="w-full text-left border-collapse">
                              <thead className="bg-white/[0.02] border-b border-white/5">
                                  <tr>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider pl-8">ID / 书名</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">作者</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">分类</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">库存</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">价格</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">状态</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">出版社</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">供应商</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">出版日期</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">采购单状态</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider text-center">操作</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {getFilteredShortageBooks().map(book => (
                                      <TableRow key={book.id}>
                                          <td className="p-5 pl-8 max-w-[200px]">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-10 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded border border-white/10 flex items-center justify-center text-[8px] text-white/30 font-bold shadow-sm hidden">
                                                      BOOK
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                      <div className="font-medium text-white truncate" title={book.title}>{book.title}</div>
                                                      <div className="text-xs text-[#86868b] font-mono whitespace-nowrap truncate" title={`#${book.id}`}>#{book.id}</div>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-5 text-sm text-gray-300 max-w-[120px] truncate" title={book.author}>{book.author}</td>
                                          <td className="p-5">
                                              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-gray-400 whitespace-nowrap">
                                                  {book.category.split(',')[0] || book.category.split(' ')[0] || book.category}
                                              </span>
                                          </td>
                                          <td className="p-5 text-sm text-gray-300">{book.stock}</td>
                                          <td className="p-5 text-sm font-medium text-white whitespace-nowrap">¥{book.price.toFixed(2)}</td>
                                          <td className="p-5 whitespace-nowrap"><StatusBadge status={book.status} /></td>
                                          <td className="p-5 text-sm text-gray-300 max-w-[100px] truncate" title={book.publisher}>{book.publisher}</td>
                                          <td className="p-5 text-sm text-gray-300 max-w-[100px] truncate" title={book.supplier}>{book.supplier}</td>
                                          <td className="p-5 text-sm text-gray-300 whitespace-nowrap">{book.publishDate}</td>
                                          <td className="p-5 text-sm text-white">
                                            {hasPurchaseOrder(book.id) ? (
                                              <span className="px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs whitespace-nowrap">
                                                已有采购单
                                              </span>
                                            ) : (
                                              <span className="px-2 py-1 rounded-md bg-gray-500/10 border border-gray-500/20 text-gray-400 text-xs whitespace-nowrap">
                                                无采购单
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-5 text-center">
                                              <button
                                                onClick={() => {
                                                  setQuickPurchaseBookId(book.id);
                                                  setQuickPurchaseQuantity(1);
                                                  setIsQuickPurchaseModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-2 bg-[#0071e3] hover:bg-[#0062c3] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                                                title="采购该书籍"
                                              >
                                                <span>采购</span>
                                              </button>
                                          </td>
                                      </TableRow>
                                  ))}
                              </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div className="my-12">
                        <div className="border-t border-white/10"></div>
                      </div>
                      
                      {/* Purchase Orders Section */}
                      <div>
                        {/* Purchase Orders Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            采购单
                          </h2>
                          <button 
                            onClick={handleAddNew}
                            className="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0062c3] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 border border-transparent hover:border-white/10 whitespace-nowrap"
                          >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">新增采购单</span>
                          </button>
                        </div>
                        
                        {/* Purchase Orders Table */}
                        <div className="bg-[#1c1c1e]/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm mb-8">
                          {/* Search Bar for Purchase Orders */}
                          <div className="p-4 border-b border-white/5">
                            <div className="relative group flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors" />
                              <input 
                                  type="text" 
                                  placeholder="搜索订单号或书名..."
                                  value={purchaseSearchQuery}
                                  onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                                  className="w-full bg-[#1c1c1e]/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#0071e3] focus:bg-[#1c1c1e] transition-all outline-none placeholder:text-[#515154]"
                              />
                            </div>
                          </div>
                          
                          <table className="w-full text-left border-collapse">
                              <thead className="bg-white/[0.02] border-b border-white/5">
                                  <tr>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider pl-8">ID / 订单号</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">书名</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">供应商</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">供应商邮箱</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">数量</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">状态</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider text-center">操作</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {getFilteredPurchaseOrders().map(order => (
                                      <TableRow key={order.id}>
                                          <td className="p-5 pl-8 max-w-[200px]">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-10 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded border border-white/10 flex items-center justify-center text-[8px] text-white/30 font-bold shadow-sm hidden">
                                                      ORDER
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                      <div className="font-medium text-white truncate" title={order.id}>{order.id}</div>
                                                      <div className="text-xs text-[#86868b] font-mono whitespace-nowrap truncate" title={`#${order.id}`}>#{order.id}</div>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-5 text-sm text-gray-300 max-w-[120px] truncate" title={order.bookTitle || '未知图书'}>{order.bookTitle || '未知图书'}</td>
                                          <td className="p-5 text-sm text-gray-300 max-w-[100px] truncate" title={order.supplier || '未设置'}>{order.supplier || '未设置'}</td>
                                          <td className="p-5 text-sm text-[#0071e3] truncate" title={order.supplierEmail || '未设置'}>{order.supplierEmail || '未设置'}</td>
                                          <td className="p-5 text-sm text-gray-300">{order.quantity}</td>
                                          <td className="p-5 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPurchaseStatusColor(order.status)}`}>
                                              {order.status}
                                            </span>
                                          </td>
                                          <td className="p-5 text-center">
                                              <div className="flex items-center justify-center gap-2">
                                                <button
                                                  onClick={() => handleEdit(order)}
                                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                                  title="编辑采购单"
                                                >
                                                  <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleContactSupplier(order.id, order.supplier || '未知', order.supplierEmail || '未设置', order.status)}
                                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                                                  title="联系供应商"
                                                >
                                                  <Mail className="w-4 h-4" />
                                                </button>
                                                {order.status === '待处理' && (
                                                  <button
                                                    onClick={() => {
                                                      const newData = { ...order, status: '已取消' };
                                                      handleEdit(newData);
                                                    }}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-colors"
                                                    title="取消采购单"
                                                  >
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => handleDelete(order.id, 'purchaseOrders')}
                                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                                  title="删除采购单"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                          </td>
                                      </TableRow>
                                  ))}
                              </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Regular Table for Other Tabs */}
                  {activeTab !== 'shortage' && (
                      <div className="bg-[#1c1c1e]/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                          <table className="w-full text-left border-collapse">
                          <thead className="bg-white/[0.02] border-b border-white/5">
                              <tr>
                                  {activeTab === 'books' && <>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider pl-8">ID / 书名</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">作者</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">分类</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">库存</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">价格</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">状态</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">出版社</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">供应商</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">出版日期</th>
                                  </>}
                                  {activeTab === 'orders' && <>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider pl-8">订单号</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">书名</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">客户</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">日期</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">数量</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">总金额</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">状态</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">收货地址</th>
                                  </>}
                                  {activeTab === 'users' && <>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider pl-8">用户</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">邮箱</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">会员等级</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">角色</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">电话</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">地址</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">余额</th>
                                  </>}
                                  {activeTab === 'suppliers' && <>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider pl-8">供应商名称</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">分类</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">区域</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">邮箱</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">电话</th>
                                      <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider">网站</th>
                                  </>}
                                  <th className="p-5 text-xs font-medium text-[#86868b] uppercase tracking-wider text-center">操作</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {/* --- Books Row --- */}
                              {activeTab === 'books' && getFilteredBooks().map(book => (
                                  <TableRow key={book.id}>
                                      <td className="p-5 pl-8 max-w-[200px]">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded border border-white/10 flex items-center justify-center text-[8px] text-white/30 font-bold shadow-sm hidden">
                                                  BOOK
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                  <div className="font-medium text-white truncate" title={book.title}>{book.title}</div>
                                                  <div className="text-xs text-[#86868b] font-mono whitespace-nowrap truncate" title={`#${book.id}`}>#{book.id}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-5 text-sm text-gray-300 max-w-[120px] truncate" title={book.author}>{book.author}</td>
                                      <td className="p-5">
                                          <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-gray-400 whitespace-nowrap">
                                              {book.category.split(',')[0] || book.category.split(' ')[0] || book.category}
                                          </span>
                                      </td>
                                      <td className="p-5 text-sm text-gray-300">{book.stock}</td>
                                      <td className="p-5 text-sm font-medium text-white whitespace-nowrap">¥{book.price.toFixed(2)}</td>
                                      <td className="p-5 whitespace-nowrap"><StatusBadge status={book.status} /></td>
                                      <td className="p-5 text-sm text-gray-300 max-w-[100px] truncate" title={book.publisher}>{book.publisher}</td>
                                      <td className="p-5 text-sm text-gray-300 max-w-[100px] truncate" title={book.supplier}>{book.supplier}</td>
                                      <td className="p-5 text-sm text-gray-300 whitespace-nowrap">{book.publishDate}</td>
                                      <td className="p-5 text-center">
                                          <ActionButtons onEdit={() => handleEdit(book)} onRestock={() => handleRestock(book.id)} onDelete={() => handleDelete(book.id, 'books')} />
                                      </td>
                                  </TableRow>
                              ))}

                              {/* --- Orders Row --- */}
                              {activeTab === 'orders' && getFilteredOrders().map(order => (
                                  <TableRow key={order.id}>
                                      <td className="p-5 pl-8 text-sm font-mono text-gray-400 whitespace-nowrap truncate" title={order.id}>{order.id}</td>
                                      <td className="p-5 text-sm text-white max-w-[200px] truncate" title={order.bookTitle || '未知图书'}>
                                        {order.bookTitle || '未知图书'}
                                      </td>
                                      <td className="p-5 text-sm font-medium text-white whitespace-nowrap truncate" title={order.customer}>{order.customer}</td>
                                      <td className="p-5 text-sm text-gray-400 whitespace-nowrap">{order.date}</td>
                                      <td className="p-5 text-sm text-gray-300 whitespace-nowrap">{order.items} Items</td>
                                      <td className="p-5 text-sm font-medium text-white whitespace-nowrap">¥{order.total?.toFixed(2) || '0.00'}</td>
                                      <td className="p-5 whitespace-nowrap"><StatusBadge status={order.status} /></td>
                                      <td className="p-5 text-sm text-gray-300 max-w-xs truncate" title={order.shippingAddress || '未设置'}>{order.shippingAddress || '未设置'}</td>
                                      <td className="p-5 text-center">
                                          <ActionButtons onEdit={() => handleEdit(order)} onDelete={() => handleDelete(order.id, 'orders')} />
                                      </td>
                                  </TableRow>
                              ))}

                              {/* --- Users Row --- */}
                              {activeTab === 'users' && getFilteredUsers().map(user => (
                                  <TableRow key={user.id}>
                                      <td className="p-5 pl-8">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0071e3] to-[#5ac8fa] flex items-center justify-center text-xs font-bold text-white shadow-md shadow-blue-900/20 hidden">
                                                  {(user.full_name || user.username || 'U').charAt(0)}
                                              </div>
                                              <span className="font-medium text-white whitespace-nowrap truncate" title={user.full_name || user.username}>{user.full_name || user.username}</span>
                                          </div>
                                      </td>
                                      <td className="p-5 text-sm text-gray-400 whitespace-nowrap truncate" title={user.email}>{user.email}</td>
                                      <td className="p-5 whitespace-nowrap">
                                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCreditLevelStyle(user.creditLevel)}`}>
                                              {getCreditLevelName(user.creditLevel)}
                                          </span>
                                      </td>
                                      <td className="p-5 text-sm text-gray-400 whitespace-nowrap">{user.role === 'admin' ? '管理员' : '用户'}</td>
                                      <td className="p-5 text-sm text-gray-400 whitespace-nowrap truncate" title={user.phone}>{user.phone}</td>
                                      <td className="p-5 text-sm text-gray-400 max-w-[120px] truncate" title={user.profile_address}>{user.profile_address}</td>
                                      <td className="p-5 text-sm font-medium text-white whitespace-nowrap">¥{user.balance?.toFixed(2) || '0.00'}</td>
                                      <td className="p-5 text-center">
                                          <ActionButtons onEdit={() => handleEdit(user)} onDelete={() => handleDelete(user.id, 'users')} />
                                      </td>
                                  </TableRow>
                              ))}

                              {/* --- Suppliers Row --- */}
                              {activeTab === 'suppliers' && getFilteredSuppliers().map(supplier => (
                                  <TableRow key={supplier.id}>
                                      <td className="p-5 pl-8 text-sm font-medium text-white whitespace-nowrap truncate" title={supplier.name}>{supplier.name}</td>
                                      <td className="p-5">
                                          <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-gray-400 whitespace-nowrap">
                                              {supplier.category}
                                          </span>
                                      </td>
                                      <td className="p-5 text-sm text-gray-300 whitespace-nowrap">{supplier.region}</td>
                                      <td className="p-5 text-sm text-[#0071e3] hover:underline cursor-pointer whitespace-nowrap truncate" title={supplier.email}>{supplier.email}</td>
                                      <td className="p-5 text-sm text-gray-400 whitespace-nowrap truncate" title={supplier.phone}>{supplier.phone}</td>
                                      <td className="p-5 text-sm text-[#0071e3] hover:underline cursor-pointer max-w-xs truncate" 
                                        title={supplier.website || '未设置'}
                                        onClick={() => {
                                          if (supplier.website && supplier.website !== '未设置') {
                                            let url = supplier.website;
                                            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                              url = 'http://' + url;
                                            }
                                            window.open(url, '_blank');
                                          }
                                        }}
                                      >
                                        {supplier.website || '未设置'}
                                      </td>
                                      <td className="p-5 text-center">
                                          <ActionButtons 
                                            onEdit={() => handleEdit(supplier)} 
                                            onDelete={() => handleDelete(supplier.id, 'suppliers')}
                                            onNotify={() => handleNotifyRestock(supplier.id, supplier.name, supplier.email)}
                                            isSupplier={true}
                                          />
                                      </td>
                                  </TableRow>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  )}

              </div>
          </main>
      </div>

      {/* --- Edit/Add Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up transform transition-all">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white">{editingItem ? '编辑信息' : '新增条目'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-[#86868b] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-4">
                  {activeTab === 'books' ? (
                      // 图书信息表单
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">书名</label>
                          <input 
                            type="text" 
                            name="title"
                            defaultValue={
                              editingItem && 'title' in editingItem ? editingItem.title as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入书名" 
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">作者</label>
                            <input 
                              type="text" 
                              name="author"
                              defaultValue={
                                editingItem && 'author' in editingItem ? editingItem.author as string : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="请输入作者，多个作者用逗号分隔（支持中英文逗号），最多4个"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">价格</label>
                            <input 
                              type="number" 
                              name="price"
                              step="0.01"
                              defaultValue={
                                editingItem && 'price' in editingItem ? editingItem.price as number : 0
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors hide-spinners" 
                              placeholder="请输入价格" 
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">库存 *</label>
                            <input 
                              type="number" 
                              name="stock"
                              defaultValue={
                                editingItem && 'stock' in editingItem ? editingItem.stock as number : 0
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors hide-spinners" 
                              placeholder="请输入库存数量" 
                              required
                              min="0"
                            />
                            <p className="text-xs text-yellow-500/70 mt-1">⚠️ 库存数量不能低于0</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">分类</label>
                            <input 
                              type="text" 
                              name="category"
                              defaultValue={
                                editingItem && 'category' in editingItem ? editingItem.category as string : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="请输入分类" 
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">出版社</label>
                          <input 
                            type="text" 
                            name="publisher"
                            defaultValue={
                              editingItem && 'publisher' in editingItem ? editingItem.publisher as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入出版社" 
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">供应商</label>
                          <input 
                            type="text" 
                            name="supplier"
                            defaultValue={
                              editingItem && 'supplier' in editingItem ? editingItem.supplier as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入供应商" 
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">丛书编号</label>
                          <input 
                            type="number" 
                            name="seriesNo"
                            defaultValue={
                              editingItem && 'seriesNo' in editingItem ? editingItem.seriesNo as number : 0
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors hide-spinners" 
                            placeholder="请输入丛书编号，0表示不属于丛书" 
                          />
                        </div>
                      </>
                    ) : activeTab === 'orders' ? (
                      // 订单信息表单（仅可修改状态）
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">订单号</label>
                          <input 
                            type="text" 
                            name="orderId"
                            defaultValue={
                              editingItem && 'id' in editingItem ? editingItem.id as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                            disabled
                            readOnly
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">客户</label>
                            <input 
                              type="text" 
                              defaultValue={
                                editingItem && 'customer' in editingItem ? editingItem.customer as string : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                              disabled
                              readOnly
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">书名</label>
                            <input 
                              type="text" 
                              defaultValue={
                                editingItem && 'bookTitle' in editingItem ? editingItem.bookTitle as string : '未知图书'
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                              disabled
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">数量</label>
                            <input 
                              type="text" 
                              defaultValue={
                                editingItem && 'items' in editingItem ? `${editingItem.items} Items` : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                              disabled
                              readOnly
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">总金额</label>
                            <input 
                              type="text" 
                              defaultValue={
                                editingItem && 'total' in editingItem ? `¥${(editingItem.total as number).toFixed(2)}` : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                              disabled
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">收货地址</label>
                          <input 
                            type="text" 
                            defaultValue={
                              editingItem && 'shippingAddress' in editingItem ? editingItem.shippingAddress as string : '未设置'
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                            disabled
                            readOnly
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">订单状态</label>
                          <select 
                            name="status"
                            defaultValue={
                              editingItem && 'status' in editingItem ? editingItem.status as string : '待出库'
                            }
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all duration-200 hover:border-white/20 cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2386868b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                              backgroundPosition: 'right 1rem center'
                            }}
                          >
                            <option value="待出库" className="bg-[#1d1d1f] text-white py-2">⏳ 待出库</option>
                            <option value="运输中" className="bg-[#1d1d1f] text-white py-2">🚚 运输中</option>
                            <option value="已送达" className="bg-[#1d1d1f] text-white py-2">✅ 已送达</option>
                            <option value="已取消" className="bg-[#1d1d1f] text-white py-2">❌ 已取消</option>
                          </select>
                        </div>
                      </>
                    ) : activeTab === 'suppliers' ? (
                      // 供应商信息表单
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">供应商名称</label>
                          <input 
                            type="text" 
                            name="name"
                            defaultValue={
                              editingItem && 'name' in editingItem ? editingItem.name as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入供应商名称" 
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">邮箱</label>
                          <input 
                            type="email" 
                            name="email"
                            defaultValue={
                              editingItem && 'email' in editingItem ? editingItem.email as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入邮箱地址" 
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">电话</label>
                            <input 
                              type="text" 
                              name="phone"
                              defaultValue={
                                editingItem && 'phone' in editingItem ? editingItem.phone as string : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="请输入电话号码" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">地区</label>
                            <input 
                              type="text" 
                              name="region"
                              defaultValue={
                                editingItem && 'region' in editingItem ? editingItem.region as string : '中国'
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="请输入地区" 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">供应图书类型</label>
                          <input 
                            type="text" 
                            name="category"
                            defaultValue={
                              editingItem && 'category' in editingItem ? editingItem.category as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入供应图书类型，例如：计算机,文学" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">网站</label>
                          <input 
                            type="text" 
                            name="website"
                            defaultValue={
                              editingItem && 'website' in editingItem ? editingItem.website as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入网站地址" 
                          />
                        </div>
                      </>
                    ) : activeTab === 'shortage' && !editingItem ? (
                      // 新增采购单表单
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">书籍 *</label>
                          <select 
                            name="book_id"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all duration-200 hover:border-white/20 cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2386868b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                              backgroundPosition: 'right 1rem center'
                            }}
                            required
                          >
                            <option value="" className="bg-[#1d1d1f] text-gray-400">-- 请选择一本图书 --</option>
                            {books.map(book => (
                              <option key={book.id} value={book.id} className="bg-[#1d1d1f] text-white">
                                {book.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">采购数量 *</label>
                          <input 
                            type="number" 
                            name="quantity"
                            defaultValue={1}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors hide-spinners" 
                            placeholder="请输入采购数量" 
                            required
                            min="1"
                          />
                        </div>
                      </>
                    ) : activeTab === 'shortage' && editingItem ? (
                      // 采购单信息表单
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">书名</label>
                          <input 
                            type="text" 
                            disabled
                            readOnly
                            defaultValue={
                              editingItem && 'bookTitle' in editingItem ? editingItem.bookTitle as string : '未知图书'
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">供应商</label>
                          <input 
                            type="text" 
                            disabled
                            readOnly
                            defaultValue={
                              editingItem && 'supplier' in editingItem ? editingItem.supplier as string : '未设置'
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">供应商邮箱</label>
                          <input 
                            type="text" 
                            disabled
                            readOnly
                            defaultValue={
                              editingItem && 'supplierEmail' in editingItem ? editingItem.supplierEmail as string : '未设置'
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">数量</label>
                            <input 
                              type="number" 
                              name="quantity"
                              defaultValue={
                                editingItem && 'quantity' in editingItem ? editingItem.quantity as number : 0
                              } 
                              className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none transition-colors hide-spinners ${
                                editingItem && 'status' in editingItem && (editingItem.status as string) !== '待处理'
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : 'text-white focus:border-[#0071e3]'
                              }`} 
                              placeholder="请输入采购数量" 
                              required
                              min="1"
                              disabled={editingItem && 'status' in editingItem && (editingItem.status as string) !== '待处理'}
                            />
                            {editingItem && 'status' in editingItem && (editingItem.status as string) !== '待处理' && (
                              <p className="text-xs text-yellow-500/70 mt-1">⚠️ 仅待处理状态可修改数量</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">状态</label>
                            <select 
                              name="status"
                              defaultValue={
                                editingItem && 'status' in editingItem ? editingItem.status as string : '待处理'
                              }
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all duration-200 hover:border-white/20 cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2386868b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                                backgroundPosition: 'right 1rem center'
                              }}
                            >
                              <option value="待处理" className="bg-[#1d1d1f] text-white py-2">待处理</option>
                              <option value="待发货" className="bg-[#1d1d1f] text-white py-2">待发货</option>
                              <option value="运输中" className="bg-[#1d1d1f] text-white py-2">运输中</option>
                              <option value="已完成" className="bg-[#1d1d1f] text-white py-2">已完成</option>
                              <option value="已取消" className="bg-[#1d1d1f] text-white py-2">已取消</option>
                            </select>
                          </div>
                        </div>
                      </>
                    ) : activeTab === 'users' ? (
                      // 用户信息表单
                      <>
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">姓名</label>
                          <input 
                            type="text" 
                            name="full_name"
                            defaultValue={
                              editingItem && 'full_name' in editingItem ? editingItem.full_name as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入姓名" 
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">用户名 {!editingItem && '*'}</label>
                            <input 
                              type="text" 
                              name="username"
                              defaultValue={
                                editingItem && 'username' in editingItem ? editingItem.username as string : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="请输入用户名"
                              required={!editingItem}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">邮箱 {!editingItem && '*'}</label>
                            <input 
                              type="email" 
                              name="email"
                              defaultValue={
                                editingItem && 'email' in editingItem ? editingItem.email as string : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="请输入邮箱" 
                              required={!editingItem}
                            />
                          </div>
                        </div>
                        
                        {!editingItem && (
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">密码</label>
                            <input 
                              type="password" 
                              name="password"
                              defaultValue="123456"
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="默认密码: 123456" 
                            />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">电话</label>
                            <input 
                              type="text" 
                              name="phone"
                              defaultValue={
                                editingItem && 'phone' in editingItem ? editingItem.phone as string : ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="请输入电话号码" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">会员等级</label>
                            <select 
                              name="creditLevel"
                              defaultValue={
                                editingItem && 'creditLevel' in editingItem ? (editingItem.creditLevel as number).toString() : '1'
                              }
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all duration-200 hover:border-white/20 cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2386868b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                                backgroundPosition: 'right 1rem center'
                              }}
                            >
                              <option value="1" className="bg-[#1d1d1f] text-white py-2">🅰️ 普通会员</option>
                              <option value="2" className="bg-[#1d1d1f] text-white py-2">🥈 银卡会员</option>
                              <option value="3" className="bg-[#1d1d1f] text-white py-2">🥇 金卡会员</option>
                              <option value="4" className="bg-[#1d1d1f] text-white py-2">⭐ 白金会员</option>
                              <option value="5" className="bg-[#1d1d1f] text-white py-2">💎 钻石会员</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">地址</label>
                          <input 
                            type="text" 
                            name="address"
                            defaultValue={
                              editingItem && 'profile_address' in editingItem ? editingItem.profile_address as string : ''
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                            placeholder="请输入地址" 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">余额</label>
                          <input 
                            type="number" 
                            name="balance"
                            step="0.01"
                            defaultValue={
                              editingItem && 'balance' in editingItem ? (editingItem.balance as number).toString() : '0'
                            } 
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors hide-spinners" 
                            placeholder="请输入余额" 
                          />
                        </div>
                      </>
                    ) : (
                      // 其他tab的默认表单
                      <>
                        <div className="space-y-2">
                            <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">名称 / 标题</label>
                            <input 
                              type="text" 
                              defaultValue={
                                editingItem ? 
                                (('title' in editingItem && typeof editingItem.title === 'string') ? editingItem.title : 
                                 ('name' in editingItem && typeof editingItem.name === 'string') ? editingItem.name : '') : 
                                ''
                              } 
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                              placeholder="请输入..." 
                            />

                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">类别 / 角色</label>
                                <input 
                                  type="text" 
                                  defaultValue={
                                    editingItem ? 
                                    (('category' in editingItem && typeof editingItem.category === 'string') ? editingItem.category : 
                                     ('role' in editingItem && typeof editingItem.role === 'string') ? editingItem.role : '') : 
                                    ''
                                  } 
                                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors" 
                                  placeholder="请输入..." 
                                />

                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">状态</label>
                                <select className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors appearance-none">
                                    <option>Active</option>
                                    <option>Inactive</option>
                                    <option>In Stock</option>
                                    <option>Out of Stock</option>
                                </select>
                            </div>
                        </div>
                      </>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium">取消</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-[#0071e3] text-white hover:bg-[#0062c3] transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                            <Save className="w-4 h-4" /> 保存更改
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- Restock Modal --- */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsRestockModalOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up transform transition-all">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white">图书补货</h3>
                    <button onClick={() => setIsRestockModalOpen(false)} className="text-[#86868b] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">补货数量</label>
                        <input 
                          type="number" 
                          value={restockQuantity}
                          onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors hide-spinners" 
                          placeholder="请输入补货数量" 
                          min="1"
                        />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsRestockModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium">取消</button>
                        <button 
                          type="button" 
                          onClick={handleRestockSubmit}
                          className="flex-1 py-3 rounded-xl bg-[#0071e3] text-white hover:bg-[#0062c3] transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <Save className="w-4 h-4" /> 确认补货
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Quick Purchase Modal --- */}
      {isQuickPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsQuickPurchaseModalOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up transform transition-all">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white">快速采购</h3>
                    <button onClick={() => setIsQuickPurchaseModalOpen(false)} className="text-[#86868b] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-[#86868b] uppercase font-bold tracking-wider">采购数量 *</label>
                        <input 
                          type="number" 
                          value={quickPurchaseQuantity}
                          onChange={(e) => setQuickPurchaseQuantity(parseInt(e.target.value) || 1)}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#0071e3] outline-none transition-colors hide-spinners" 
                          placeholder="请输入采购数量" 
                          min="1"
                        />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsQuickPurchaseModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium">取消</button>
                        <button 
                          type="button" 
                          onClick={async () => {
                            if (!quickPurchaseBookId || quickPurchaseQuantity <= 0) {
                              toast.error('请输入有效的采购数量');
                              return;
                            }
                            
                            try {
                              const response = await fetch('/api/purchase-orders/create', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  book_id: quickPurchaseBookId,
                                  quantity: quickPurchaseQuantity
                                }),
                              });
                              
                              const result = await response.json();
                              
                              if (result.success) {
                                await refreshData();
                                setIsQuickPurchaseModalOpen(false);
                                toast.success('采购单已创建成功');
                              } else {
                                toast.error(`创建失败: ${result.message}`);
                              }
                            } catch (error) {
                              console.error('创建采购单时出错:', error);
                              toast.error('创建采购单时发生错误');
                            }
                          }}
                          className="flex-1 py-3 rounded-xl bg-[#0071e3] text-white hover:bg-[#0062c3] transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <Save className="w-4 h-4" /> 确认采购
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        /* Hide spinners for number inputs */
        .hide-spinners::-webkit-outer-spin-button,
        .hide-spinners::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-spinners {
          -moz-appearance: textfield;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 0.05; transform: scale(1); }
          100% { opacity: 0.1; transform: scale(1.05); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}

// --- Sub Components ---

function NavItem({ icon, label, active, onClick }: { 
  icon: React.ReactElement; 
  label: string; 
  active: boolean; 
  onClick: () => void; 
}) {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                ${active ? 'bg-[#0071e3]/10 text-white border border-[#0071e3]/20 shadow-[0_0_20px_rgba(0,113,227,0.15)]' : 'text-[#86868b] hover:bg-white/5 hover:text-white border border-transparent'}
            `}
        >
            {React.cloneElement(icon, { className: `w-5 h-5 ${active ? 'text-[#0071e3]' : 'text-[#86868b] group-hover:text-white'}` } as React.HTMLAttributes<SVGElement>)}
            <span className="hidden lg:block font-medium text-sm">{label}</span>
        </button>
    );
}

function TableRow({ children }: { children: React.ReactNode }) {
    return (
        <tr className="group hover:bg-white/[0.03] transition-colors border-b border-transparent hover:border-white/5">
            {children}
        </tr>
    );
}

function StatusBadge({ status }: { status: string }) {
    let colorClass = "";
    switch (status) {
      case 'In Stock': case 'Completed': case 'Active': colorClass = 'bg-green-500/10 text-green-400 border-green-500/20'; break;
      case 'Low Stock': case 'Processing': case 'Pending': colorClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'; break;
      case 'Out of Stock': case 'Cancelled': case 'Inactive': colorClass = 'bg-red-500/10 text-red-400 border-red-500/20'; break;
      default: colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    
    return (
        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
            {status}
        </span>
    );
}

function ActionButtons({ onEdit, onDelete, onRestock, onNotify, isSupplier }: { 
  onEdit: () => void; 
  onDelete: () => void; 
  onRestock?: () => void;
  onNotify?: () => void;
  isSupplier?: boolean;
}) {
    return (
        <div className="flex items-center justify-center gap-2">
            <button 
                onClick={onEdit} 
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#86868b] hover:bg-[#0071e3] hover:text-white hover:border-[#0071e3] hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                title="编辑"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            {onRestock && (
                <button 
                    onClick={onRestock} 
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#86868b] hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/20 transition-all"
                    title="补货"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20" />
                        <path d="M8 10l4-4 4 4" />
                        <path d="M8 18l4 4 4-4" />
                    </svg>
                </button>
            )}
            {onNotify && isSupplier && (
                <button 
                    onClick={onNotify} 
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#86868b] hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                    title="通知补货"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                </button>
            )}
            <button 
                onClick={onDelete} 
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#86868b] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                title="删除"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

