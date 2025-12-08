import { Resend } from 'resend';

// 初始化 Resend 客户端
// 在构建时使用占位符，运行时使用实际的 API Key
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build');

// 邮件发送者配置
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * 发送邮件的通用方法
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}) {
  try {
    // 验证 API Key 是否存在（仅在运行时）
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder_for_build') {
      console.warn('警告：Resend API Key 未配置，邮件发送将失败');
      throw new Error('Resend API Key 未配置，请在 .env.local 中设置 RESEND_API_KEY');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: html || '',
      text: text || '',
      ...(replyTo && { replyTo }),
    } as any);

    if (result.error) {
      console.error('邮件发送失败:', result.error);
      throw new Error(`邮件发送失败: ${result.error.message}`);
    }

    console.log('邮件发送成功:', result.data?.id);
    return result;
  } catch (error) {
    console.error('邮件服务错误:', error);
    throw error;
  }
}

/**
 * 发送欢迎邮件
 */
export async function sendWelcomeEmail(email: string, username: string) {
  const subject = '欢迎加入 ibookstore';
  const logoUrl = `https://raw.githubusercontent.com/Mengbooo/db_project/7dff849ae31608c0c8e25e4f08b97ff50104fc59/public/logo.svg`;
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>欢迎来到 ibookstore</title>
        <style>
            /* 基础重置 */
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                background-color: #000000; /* 纯黑背景 */
                color: #E0E0E0; /* 基础字体颜色：灰白 */
                line-height: 1.6;
                -webkit-font-smoothing: antialiased;
            }

            /* 布局容器 */
            .wrapper {
                width: 100%;
                background-color: #000000;
                padding: 40px 0;
            }

            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #0A0A0A; /* 卡片背景 */
                border: 1px solid #1F1F1F;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }

            /* 顶部 Logo 区域 */
            .logo-area {
                text-align: center;
                padding: 30px 0 20px 0;
                background-color: #000000;
            }
            .logo-img {
                display: block;
                margin: 0 auto;
                max-width: 150px; /* 限制 Logo 最大宽度 */
                height: auto;
            }

            /* 内容主体 */
            .content {
                padding: 40px;
            }

            /* 标题样式 */
            h1 {
                margin: 0 0 24px 0;
                color: #FFFFFF;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }

            /* 文本段落 */
            p {
                margin: 0 0 16px 0;
                color: #B0B0B0;
                font-size: 15px;
            }

            strong {
                color: #1620E4; /* 主题色强调 */
                font-weight: 600;
            }

            /* 列表样式 */
            ul {
                margin: 24px 0;
                padding: 0;
                list-style: none;
            }
            li {
                padding: 10px 0;
                padding-left: 28px;
                position: relative;
                color: #D1D1D1;
                font-size: 15px;
                border-bottom: 1px dashed #1F1F1F; /* 增加列表分割线增加精致感 */
            }
            li:last-child {
                border-bottom: none;
            }
            /* 自定义列表圆点 */
            li::before {
                content: "•";
                color: #1620E4;
                font-weight: bold;
                font-size: 20px;
                position: absolute;
                left: 0;
                top: 4px;
                line-height: 1;
            }

            /* 按钮样式 */
            .btn-container {
                margin-top: 32px;
                text-align: left;
            }
            .button {
                display: inline-block;
                background-color: #1620E4;
                color: #FFFFFF !important;
                padding: 14px 32px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                transition: background-color 0.3s ease;
                box-shadow: 0 4px 12px rgba(22, 32, 228, 0.3);
            }
            .button:hover {
                background-color: #1218B0;
            }

            /* ----- Footer 高级设计 ----- */
            .footer {
                background-color: #050505;
                border-top: 1px solid #1F1F1F;
                padding: 30px 40px;
                text-align: center;
            }
            
            .footer-links {
                margin-bottom: 20px;
            }
            .footer-link {
                color: #666;
                text-decoration: none;
                margin: 0 10px;
                font-size: 12px;
                transition: color 0.2s;
            }
            .footer-link:hover {
                color: #1620E4;
            }

            .footer-social {
                margin-bottom: 20px;
            }
            .social-icon {
                display: inline-block;
                width: 8px;
                height: 8px;
                background-color: #333;
                border-radius: 50%;
                margin: 0 5px;
            }

            .footer-copy {
                color: #444;
                font-size: 12px;
                margin-bottom: 8px;
            }
            .footer-address {
                color: #333;
                font-size: 11px;
                line-height: 1.4;
            }

            /* 移动端适配 */
            @media only screen and (max-width: 600px) {
                .content { padding: 24px; }
                .footer { padding: 24px; }
                .container { border-radius: 0; border: none; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <!-- Logo 区域 -->
            <div class="logo-area">
                <img src="${logoUrl}" alt="ibookstore Logo" class="logo-img" width="120">
            </div>

            <div class="container">
                <div class="content">
                    <h1>欢迎加入 ibookstore</h1>
                    
                    <p>您好，<strong>${username}</strong></p>
                    
                    <p>感谢您注册。ibookstore 是您探索知识海洋的起点，我们已为您准备好专属的阅读空间。</p>
                    
                    <p>您现在可以体验：</p>
                    
                    <ul>
                        <li>浏览和购买海量精选图书</li>
                        <li>实时追踪订单状态</li>
                        <li>查看账户余额与会员晋升等级</li>
                        <li>敬请期待...</li>
                    </ul>
                    
                    <p style="margin-top: 24px; font-size: 14px; color: #888;">如果在购书过程中遇到任何问题，欢迎随时联系客服。</p>
                    
                    <div class="btn-container">
                        <a href="https://db-project-five.vercel.app" class="button">进入个人中心</a>
                    </div>
                </div>

                <!-- 全新设计的 Footer -->
                <div class="footer">
                    <div class="footer-links">
                        <a href="https://db-project-five.vercel.app" class="footer-link">官方网站</a> |
                        <a href="https://db-project-five.vercel.app" class="footer-link">帮助中心</a> |
                        <a href="https://db-project-five.vercel.app" class="footer-link">隐私政策</a>
                    </div>

                    <!-- 装饰性元素 (模拟社交媒体点) -->
                    <div class="footer-social">
                        <span class="social-icon"></span>
                        <span class="social-icon"></span>
                        <span class="social-icon"></span>
                    </div>

                    <div class="footer-copy">
                        © 2025 ibookstore Inc. 保留所有权利
                    </div>
                    
                    <div class="footer-address">
                        如果你不想再接收此类邮件，可以 <a href="#" style="color: #444; text-decoration: underline;">点击退订</a><br>
                        此邮件由系统自动发送，请勿直接回复
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * 发送订单状态更新邮件
 */
export async function sendOrderStatusEmail(
  email: string,
  username: string,
  orderId: string,
  status: string,
  statusMessage: string
) {
  const statusEmoji: Record<string, string> = {
    '待出库': '📦',
    '待补货': '⏳',
    '运输中': '🚚',
    '已送达': '✅',
    '已取消': '❌',
    '派送中': '🚚',
  };

  const logoUrl = `https://raw.githubusercontent.com/Mengbooo/db_project/7dff849ae31608c0c8e25e4f08b97ff50104fc59/public/logo.svg`;
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>订单状态更新 - ibookstore</title>
        <style>
            /* --- 全局与容器样式 (保持一致) --- */
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                background-color: #000000;
                color: #E0E0E0;
                line-height: 1.6;
                -webkit-font-smoothing: antialiased;
            }

            .wrapper {
                width: 100%;
                background-color: #000000;
                padding: 40px 0;
            }

            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #0A0A0A;
                border: 1px solid #1F1F1F;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }

            /* --- Logo --- */
            .logo-area {
                text-align: center;
                padding: 30px 0 20px 0;
                background-color: #000000;
            }
            .logo-img {
                display: block;
                margin: 0 auto;
                max-width: 150px;
                height: auto;
            }

            /* --- 内容区域 --- */
            .content { padding: 40px; }

            h1 {
                margin: 0 0 24px 0;
                color: #FFFFFF;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
                text-align: center;
            }

            p {
                margin: 0 0 16px 0;
                color: #B0B0B0;
                font-size: 15px;
            }

            strong {
                color: #1620E4;
                font-weight: 600;
            }

            /* --- 订单状态卡片 --- */
            .status-box {
                background-color: #111111;
                border: 1px solid #2A2A2A;
                border-radius: 12px;
                padding: 30px 20px;
                margin: 24px 0;
                text-align: center;
            }
            .status-emoji {
                font-size: 48px;
                line-height: 1;
                margin-bottom: 16px;
                display: block;
            }
            .status-text {
                display: block;
                font-size: 20px;
                font-weight: 700;
                color: #1620E4;
                margin-bottom: 8px;
                letter-spacing: 0.5px;
            }
            .status-desc {
                font-size: 14px;
                color: #888888;
                margin: 0;
            }

            /* --- 按钮 --- */
            .btn-container {
                margin-top: 32px;
                text-align: center;
            }
            .button {
                display: inline-block;
                background-color: #1620E4;
                color: #FFFFFF !important;
                padding: 14px 32px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                transition: background-color 0.3s ease;
                box-shadow: 0 4px 12px rgba(22, 32, 228, 0.3);
            }
            .button:hover {
                background-color: #1218B0;
            }

            /* --- Footer --- */
            .footer {
                background-color: #050505;
                border-top: 1px solid #1F1F1F;
                padding: 30px 40px;
                text-align: center;
            }
            .footer-links { margin-bottom: 20px; }
            .footer-link {
                color: #666;
                text-decoration: none;
                margin: 0 10px;
                font-size: 12px;
            }
            .footer-link:hover { color: #1620E4; }
            .footer-social { margin-bottom: 20px; }
            .social-icon {
                display: inline-block;
                width: 8px;
                height: 8px;
                background-color: #333;
                border-radius: 50%;
                margin: 0 5px;
            }
            .footer-copy { color: #444; font-size: 12px; margin-bottom: 8px; }
            .footer-address { color: #333; font-size: 11px; line-height: 1.4; }

            @media only screen and (max-width: 600px) {
                .content { padding: 24px; }
                .container { border-radius: 0; border: none; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="logo-area">
                <img src="${logoUrl}" alt="ibookstore Logo" class="logo-img" width="120">
            </div>

            <div class="container">
                <div class="content">
                    <h1>订单状态更新</h1>
                    
                    <p>您好，<strong>${username}</strong></p>
                    <p>关于您的订单 <strong>#${orderId}</strong>，我们有一条新的动态：</p>
                    
                    <div class="status-box">
                        <span class="status-emoji">${statusEmoji[status] || '📦'}</span>
                        <span class="status-text">${status}</span>
                        <p class="status-desc">${statusMessage}</p>
                    </div>

                    <p style="text-align: center; color: #999; font-size: 14px;">感谢您的耐心等待，我们会持续为您追踪物流信息。</p>
                    
                    <div class="btn-container">
                        <a href="https://db-project-five.vercel.app" class="button">查看订单详情</a>
                    </div>
                </div>

                <div class="footer">
                    <div class="footer-links">
                        <a href="#" class="footer-link">官方网站</a> |
                        <a href="#" class="footer-link">帮助中心</a> |
                        <a href="#" class="footer-link">物流查询</a>
                    </div>

                    <div class="footer-social">
                        <span class="social-icon"></span>
                        <span class="social-icon"></span>
                        <span class="social-icon"></span>
                    </div>

                    <div class="footer-copy">
                        © 2025 ibookstore Inc. 保留所有权利
                    </div>
                    
                    <div class="footer-address">
                        如需帮助，请直接回复此邮件或访问帮助中心<br>
                        此邮件由系统自动发送
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `订单状态更新 - ${orderId}`,
    html,
  });
}

/**
 * 发送采购单通知邮件给供应商
 * @param supplierEmail 供应商邮箱
 * @param supplierName 供应商名称
 * @param bookTitle 图书名称
 * @param quantity 采购/补货数量
 * @param purchaseOrderId 采购单号
 * @param type 邮件类型：'purchase'(采购通知)、'restock'(补货通知)、'contact'(联系供应商)
 */
export async function sendSupplierPurchaseNotificationEmail(
  supplierEmail: string,
  supplierName: string,
  bookTitle: string,
  quantity: number,
  purchaseOrderId: string,
  type: 'purchase' | 'restock' | 'contact' = 'purchase'
) {
  const logoUrl = `https://raw.githubusercontent.com/Mengbooo/db_project/7dff849ae31608c0c8e25e4f08b97ff50104fc59/public/logo.svg`;
  
  // 根据类型确定邮件内容
  let title = '新的采购单通知';
  let mainMessage = 'ibookstore 系统生成了一份新的采购需求，请查收：';
  let noteMessage = '请尽快确认库存并安排发货，我们会及时跟进物流状态。';
  let footerNote = '此邮件仅发送给 ibookstore 认证供应商';
  
  if (type === 'restock') {
    title = '补货通知';
    mainMessage = '系统检测到以下图书库存不足，请及时补货：';
    noteMessage = '请尽快登录系统查看详情并安排发货，感谢您的配合。';
    footerNote = '此邮件由系统自动发送';
  } else if (type === 'contact') {
    title = '补货请求';
    mainMessage = '感谢您的合作，ibookstore 需要您尽快补货以下图书：';
    noteMessage = '请尽快安排发货，我们会及时跟进。';
    footerNote = '此邮件由系统自动发送';
  }
  
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>${title} - ibookstore</title>
        <style>
            /* --- 全局与容器样式 --- */
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                background-color: #000000;
                color: #E0E0E0;
                line-height: 1.6;
                -webkit-font-smoothing: antialiased;
            }

            .wrapper {
                width: 100%;
                background-color: #000000;
                padding: 40px 0;
            }

            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #0A0A0A;
                border: 1px solid #1F1F1F;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }

            /* --- Logo --- */
            .logo-area {
                text-align: center;
                padding: 30px 0 20px 0;
                background-color: #000000;
            }
            .logo-img {
                display: block;
                margin: 0 auto;
                max-width: 150px;
                height: auto;
            }

            /* --- 内容区域 --- */
            .content { padding: 40px; }

            h1 {
                margin: 0 0 24px 0;
                color: #FFFFFF;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
                text-align: center;
            }

            p {
                margin: 0 0 16px 0;
                color: #B0B0B0;
                font-size: 15px;
            }

            strong {
                color: #FFFFFF;
                font-weight: 600;
            }

            /* --- 采购单详情卡片 --- */
            .purchase-card {
                background-color: #111111;
                border: 1px solid #2A2A2A;
                border-left: 4px solid #1620E4;
                border-radius: 8px;
                padding: 24px;
                margin: 24px 0;
            }

            .purchase-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px dashed #2A2A2A;
            }
            .purchase-row:last-child {
                border-bottom: none;
            }

            .label {
                color: #888888;
                font-size: 14px;
                flex-shrink: 0;
            }

            .value {
                color: #E0E0E0;
                font-size: 15px;
                font-weight: 500;
                text-align: right;
                margin-left: 12px;
            }

            .highlight-text {
                color: #1620E4;
                font-family: 'Courier New', monospace;
                font-weight: 700;
                letter-spacing: 1px;
            }
            
            .quantity-text {
                color: #FFFFFF;
                font-weight: 700;
                font-size: 16px;
            }

            /* --- 辅助信息 --- */
            .note {
                text-align: center;
                font-size: 14px;
                color: #666;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #1A1A1A;
            }
            
            .text-link {
                color: #1620E4;
                text-decoration: none;
                border-bottom: 1px dotted #1620E4;
            }

            /* --- Footer --- */
            .footer {
                background-color: #050505;
                border-top: 1px solid #1F1F1F;
                padding: 30px 40px;
                text-align: center;
            }
            .footer-links { margin-bottom: 20px; }
            .footer-link {
                color: #666;
                text-decoration: none;
                margin: 0 10px;
                font-size: 12px;
            }
            .footer-link:hover { color: #1620E4; }
            .footer-social { margin-bottom: 20px; }
            .social-icon {
                display: inline-block;
                width: 8px;
                height: 8px;
                background-color: #333;
                border-radius: 50%;
                margin: 0 5px;
            }
            .footer-copy { color: #444; font-size: 12px; margin-bottom: 8px; }
            .footer-address { color: #333; font-size: 11px; line-height: 1.4; }

            @media only screen and (max-width: 600px) {
                .content { padding: 24px; }
                .container { border-radius: 0; border: none; }
                .purchase-row { flex-direction: column; align-items: flex-start; }
                .value { margin-left: 0; margin-top: 4px; text-align: left; }
                .label { font-size: 12px; }
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="logo-area">
                <img src="${logoUrl}" alt="ibookstore Logo" class="logo-img" width="120">
            </div>

            <div class="container">
                <div class="content">
                    <h1>${title}</h1>
                    
                    <p>您好，<strong>${supplierName}</strong></p>
                    <p>${mainMessage}</p>
                    
                    <div class="purchase-card">
                        <div class="purchase-row">
                            <span class="label">单号</span>
                            <span class="value highlight-text">${purchaseOrderId}</span>
                        </div>
                        <div class="purchase-row">
                            <span class="label">图书名称</span>
                            <span class="value">${bookTitle}</span>
                        </div>
                        <div class="purchase-row">
                            <span class="label">数量</span>
                            <span class="value quantity-text">${quantity} 本</span>
                        </div>
                    </div>

                    <div class="note">
                        <p>${noteMessage}</p>
                        <p style="margin-bottom: 0;">如有任何疑问，请直接 <a href="mailto:support@ibookstore.com" class="text-link">回复此邮件</a> 与采购部联系。</p>
                    </div>
                </div>

                <div class="footer">
                    <div class="footer-links">
                        <a href="#" class="footer-link">供应商门户</a> |
                        <a href="#" class="footer-link">采购政策</a> |
                        <a href="#" class="footer-link">联系我们</a>
                    </div>

                    <div class="footer-social">
                        <span class="social-icon"></span>
                        <span class="social-icon"></span>
                        <span class="social-icon"></span>
                    </div>

                    <div class="footer-copy">
                        © 2025 ibookstore Inc. 保留所有权利
                    </div>
                    
                    <div class="footer-address">
                        ${footerNote}<br>
                        系统自动发送，请勿转发
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
  
  const subjectMap: Record<string, string> = {
    'purchase': `新的采购单 - ${purchaseOrderId}`,
    'restock': `补货通知 - ${purchaseOrderId}`,
    'contact': `补货请求 - ${purchaseOrderId}`
  };
  
  return sendEmail({
    to: supplierEmail,
    subject: subjectMap[type],
    html,
  });
}
