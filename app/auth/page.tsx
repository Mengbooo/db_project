"use client";

import React, { useState, useEffect } from 'react';
import { Apple, ArrowRight, Mail, Lock, User, Eye, EyeOff, Github, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState({ 
    email: '', 
    password: '', 
    name: '',
    username: '' // 添加用户名字段
  });
  const [animateOrb, setAnimateOrb] = useState(false);

  // Trigger animations on mount
  useEffect(() => {
    setAnimateOrb(true);
  }, []);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        // 登录逻辑
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formState.email,
            password: formState.password,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // 登录成功，重定向到相应页面
          toast.success("登录成功", {
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          });
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 1000);
        } else {
          toast.error(data.error || '登录失败', {
            icon: <XCircle className="w-5 h-5 text-red-500" />,
          });
        }
      } else {
        // 注册逻辑
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formState.username,
            email: formState.email,
            password: formState.password,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // 注册成功，自动切换到登录模式
          toast.success("注册成功，请登录", {
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          });
          setTimeout(() => {
            setIsLogin(true);
            setFormState({ ...formState, username: '', password: '' });
          }, 1500);
        } else {
          toast.error(data.error || '注册失败', {
            icon: <XCircle className="w-5 h-5 text-red-500" />,
          });
        }
      }
    } catch (err) {
      toast.error('网络错误，请稍后再试', {
        icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050507] text-[#f5f5f7] font-sans overflow-hidden relative flex items-center justify-center selection:bg-[#0071e3] selection:text-white">
      {/* 添加 Toaster 组件 */}
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
      
      {/* --- Ambient Background Orbs (Monochromatic Blue System) --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orb 1: Primary Blue - 更亮的颜色 */}
        <div 
          className={`absolute top-[-10%] left-1/2 w-[600px] h-[600px] bg-[#3d9eff] rounded-full blur-[160px] opacity-[0.25] transition-all duration-[10s] ease-in-out ${animateOrb ? 'translate-x-[-70%] translate-y-[10%]' : '-translate-x-1/2'}`}
          style={{ animation: 'float 12s ease-in-out infinite alternate' }}
        />
        {/* Orb 2: Deep Navy/Cyan mix for depth, instead of Purple - 更亮的颜色 */}
        <div 
          className={`absolute bottom-[-10%] left-1/2 w-[700px] h-[700px] bg-[#7dd0ff] rounded-full blur-[180px] opacity-[0.18] transition-all duration-[12s] ease-in-out ${animateOrb ? 'translate-x-[-10%] -translate-y-[10%]' : '-translate-x-1/2'}`}
          style={{ animation: 'float 15s ease-in-out infinite alternate-reverse' }}
        />
      </div>

      {/* --- Main Content Container --- */}
      <div className="relative z-10 w-full max-w-md px-6 animate-enter-up">
        
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight mb-2">
            <Apple className="w-6 h-6 fill-current" />
            <span>iBookStore</span>
          </div>
          <p className="text-[#86868b] text-sm">
            {isLogin ? '登录以访问您的书库' : '创建您的 iBookStore ID'}
          </p>
        </div>

        {/* Glass Card */}
        <div className="w-full bg-[#151516]/70 backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-8 shadow-2xl overflow-hidden relative hover:border-white/[0.12] transition-colors duration-500 ring-1 ring-white/5">
            
            {/* Form Toggle Slider */}
            <div className="flex bg-[#252527] p-1 rounded-full mb-8 relative">
                {/* 滑块背景 */}
                <div 
                    className="absolute top-1 bottom-1 bg-[#3a3a3c] shadow-[0_2px_8px_rgba(0,0,0,0.4)] rounded-full w-[calc(50%-4px)] transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)"
                    style={{ left: isLogin ? '4px' : 'calc(50%)' }}
                ></div>
                
                <button 
                    onClick={() => { setIsLogin(true); setFormState({...formState, email: '', password: '', name: ''}); }}
                    className={`flex-1 relative z-10 text-sm font-medium py-2 text-center transition-colors duration-300 ${isLogin ? 'text-white' : 'text-[#86868b]'}`}
                >
                    登录
                </button>
                <button 
                    onClick={() => { setIsLogin(false); setFormState({...formState, email: '', password: '', name: '', username: ''}); }}
                    className={`flex-1 relative z-10 text-sm font-medium py-2 text-center transition-colors duration-300 ${!isLogin ? 'text-white' : 'text-[#86868b]'}`}
                >
                    注册
                </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                {/* Username Field (仅在注册时显示) */}
                <div 
                    className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${!isLogin ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 -mb-5'}`}
                >
                    <div className="overflow-hidden">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors" />
                            <input 
                                type="text" 
                                placeholder="用户名" 
                                required={!isLogin}
                                className="w-full bg-[#1c1c1e]/50 border border-[#3a3a3c] text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#0071e3] focus:bg-[#1c1c1e] focus:ring-1 focus:ring-[#0071e3]/50 transition-all placeholder:text-[#515154]"
                                value={formState.username}
                                onChange={(e) => setFormState({...formState, username: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Email Field */}
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors" />
                    <input 
                        type="email" 
                        placeholder="name@example.com" 
                        required
                        className="w-full bg-[#1c1c1e]/50 border border-[#3a3a3c] text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#0071e3] focus:bg-[#1c1c1e] focus:ring-1 focus:ring-[#0071e3]/50 transition-all placeholder:text-[#515154]"
                        value={formState.email}
                        onChange={(e) => setFormState({...formState, email: e.target.value})}
                    />
                </div>

                {/* Password Field */}
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b] group-focus-within:text-[#0071e3] transition-colors" />
                    <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="密码" 
                        required
                        className="w-full bg-[#1c1c1e]/50 border border-[#3a3a3c] text-white rounded-xl py-3.5 pl-12 pr-12 outline-none focus:border-[#0071e3] focus:bg-[#1c1c1e] focus:ring-1 focus:ring-[#0071e3]/50 transition-all placeholder:text-[#515154]"
                        value={formState.password}
                        onChange={(e) => setFormState({...formState, password: e.target.value})}
                        style={{
                          paddingRight: '3rem',
                        }}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white transition-colors z-10"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Forgotten Password Link */}
                <div 
                    className={`flex justify-end transition-[max-height,opacity,margin] duration-300 ease-in-out overflow-hidden ${isLogin ? 'max-h-10 opacity-100 -mt-1' : 'max-h-0 opacity-0 mt-0'}`}
                >
                    <a href="#" className="text-xs text-[#0071e3] hover:text-[#5ac8fa] transition-colors flex items-center gap-1 group pb-1">
                        忘记密码?
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="mt-2 w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,113,227,0.3)] hover:shadow-[0_0_30px_rgba(0,113,227,0.5)]"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>{isLogin ? '登录' : '注册'}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover:animate-shine" />
                        </>
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4 text-[#48484a]">
                <div className="h-px flex-1 bg-[#3a3a3c]"></div>
                <span className="text-xs uppercase tracking-wider text-[#636366]">或</span>
                <div className="h-px flex-1 bg-[#3a3a3c]"></div>
            </div>

            {/* Social Logins - Unified Colors */}
            <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-xl font-medium text-sm hover:bg-[#e5e5ea] transition-colors">
                    <Apple className="w-4 h-4 mb-0.5" /> 
                    Apple
                </button>
                <button className="flex items-center justify-center gap-2 bg-[#252527] text-white border border-[#3a3a3c] py-2.5 rounded-xl font-medium text-sm hover:bg-[#3a3a3c] hover:border-[#48484a] transition-all">
                    {/* Changed Sparkle color to match the blue theme */}
                    <Github className="w-4 h-4 text-[#0071e3]" /> 
                    Github
                </button>
            </div>
            
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-xs text-[#636366] space-y-2">
            <p>
                {isLogin ? "还没有账户？" : "已有账户？"}
                <button onClick={() => setIsLogin(!isLogin)} className="text-[#0071e3] ml-1 hover:underline hover:text-[#5ac8fa] transition-colors">
                    {isLogin ? "立即注册" : "登录"}
                </button>
            </p>
            <div className="flex justify-center gap-4 mt-4">
                <a href="#" className="hover:text-[#98989d] transition-colors">隐私政策</a>
                <a href="#" className="hover:text-[#98989d] transition-colors">服务条款</a>
            </div>
        </div>

      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-30%, -60%) scale(1.1); }
          100% { transform: translate(-70%, -40%) scale(1); }
        }
        @keyframes shine {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }
        @keyframes enterUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .group-hover\\:animate-shine {
          animation: shine 1s ease-in-out;
        }
        .animate-enter-up {
          animation: enterUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        
        /* 隐藏浏览器自带的密码管理图标 */
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
        }
        
        /* 针对WebKit浏览器隐藏密码管理图标 */
        input[type="password"]::-webkit-credentials-auto-fill-button {
          display: none !important;
          visibility: hidden;
          pointer-events: none;
          height: 0;
          width: 0;
          margin: 0;
        }
        
        /* 确保自定义图标始终显示在最上层 */
        .password-toggle-icon {
          z-index: 10;
          position: relative;
        }
      `}</style>
    </div>
  );
}