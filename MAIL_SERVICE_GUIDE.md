# Resend 邮件服务集成指南

## 📧 功能概述

该项目已集成 Resend 邮件服务，提供以下功能：

| 邮件类型 | 触发场景 | 字段 |
|---------|---------|------|
| **欢迎邮件** | 用户注册成功 | `type: 'welcome'` |
| **订单确认** | 订单创建时 | `type: 'order_confirmation'` |
| **订单状态更新** | 订单状态改变 | `type: 'order_status'` |
| **取消订单** | 用户取消订单 | `type: 'order_cancellation'` |
| **供应商通知** | 采购单创建 | `type: 'supplier_notification'` |

---

## 🔧 环境配置

### 步骤1：获取 Resend API Key

1. 访问 [https://resend.com](https://resend.com)
2. 注册或登录账户
3. 进入 API Keys 页面获取 API Key
4. 复制 API Key

### 步骤2：配置环境变量

复制 `.env.local.example` 为 `.env.local`：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入您的信息：

```env
# Resend API Key
RESEND_API_KEY=re_xxx...

# 邮件发送者（开发环境可用 onboarding@resend.dev，生产环境需自己的域名）
RESEND_FROM_EMAIL=onboarding@resend.dev

# 应用URL（邮件中的链接指向这个地址）
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## 📨 API 使用方法

### 基础URL
```
POST /api/email/send
```

### 通用请求格式

所有邮件API都通过 POST 请求到 `/api/email/send`，传入 JSON 数据：

```json
{
  "type": "邮件类型",
  "email": "收件人邮箱",
  "...其他字段": "..."
}
```

---

## 💡 具体邮件类型说明

### 1. 欢迎邮件（Welcome）

**何时使用：** 用户注册成功后

**请求示例：**
```typescript
fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'welcome',
    email: 'user@example.com',
    username: '张三'
  })
})
```

**集成位置：** `/app/api/auth/register/route.ts`

---

### 2. 订单确认邮件（Order Confirmation）

**何时使用：** 订单创建成功时

**请求示例：**
```typescript
fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'order_confirmation',
    email: 'user@example.com',
    username: '张三',
    orderId: 'ORD-0001',
    items: 'The Art of Code, Deep Work',
    total: 128.50,
    address: '北京市朝阳区XXX'
  })
})
```

**集成位置：** `/app/api/orders/create/route.ts`

---

### 3. 订单状态更新邮件（Order Status）

**何时使用：** 订单状态改变时（待出库→运输中→已送达）

**请求示例：**
```typescript
fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'order_status',
    email: 'user@example.com',
    username: '张三',
    orderId: 'ORD-0001',
    status: '运输中',
    statusMessage: '您的订单已发出，预计3天内送达'
  })
})
```

**集成位置：** `/app/api/orders/update/route.ts`

---

### 4. 取消订单邮件（Order Cancellation）

**何时使用：** 用户取消订单时

**请求示例：**
```typescript
fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'order_cancellation',
    email: 'user@example.com',
    username: '张三',
    orderId: 'ORD-0001',
    refundAmount: 128.50
  })
})
```

**集成位置：** `/app/api/orders/cancel/route.ts`

---

### 5. 供应商通知邮件（Supplier Notification）

**何时使用：** 创建新采购单时通知供应商

**请求示例：**
```typescript
fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'supplier_notification',
    supplierEmail: 'supplier@example.com',
    supplierName: '清华出版社',
    bookTitle: 'The Art of Code',
    quantity: 50,
    purchaseOrderId: 'PO-0001'
  })
})
```

**集成位置：** `/app/api/purchase-orders/create/route.ts`

---

## 📁 文件结构

```
lib/
├── email.ts              ← 邮件工具库（所有发送函数）

app/api/email/
└── send/
    └── route.ts          ← 邮件API端点

.env.local                ← 环境变量（本地）
.env.local.example        ← 环境变量示例
```

---

## 🚀 快速集成指南

### 在订单创建API中发送邮件

修改 `/app/api/orders/create/route.ts`：

```typescript
// ... 订单创建逻辑 ...

// 发送确认邮件
try {
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'order_confirmation',
      email: user.email,
      username: user.username,
      orderId: orderNumber,
      items: bookTitles.join(', '),
      total: totalPrice,
      address: orderAddress
    })
  });
} catch (error) {
  console.error('邮件发送失败:', error);
  // 邮件失败不影响订单创建
}
```

---

## ⚙️ 可选功能

### 支持HTML和纯文本

```typescript
await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom',
    to: 'user@example.com',
    subject: '自定义主题',
    html: '<p>HTML内容</p>',
    text: '纯文本备用内容'
  })
})
```

---

## 🔍 测试邮件

### 在Resend Dashboard中测试

1. 登录 [Resend Dashboard](https://dashboard.resend.com)
2. 找到 "Emails" 部分
3. 点击 "Send Test Email"
4. 输入您的邮箱进行测试

### 使用cURL命令测试API

```bash
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "email": "test@example.com",
    "username": "测试用户"
  }'
```

---

## 💰 免费额度说明

- **Free Plan:** 100封/天
- **Pro Plan:** 无限制
- 超出额度后按实际使用量计费

---

## 🆘 常见问题

### Q: 为什么邮件没有发送？
A: 检查以下几点：
1. `RESEND_API_KEY` 是否正确配置
2. 开发环境是否使用了 `onboarding@resend.dev`
3. 检查日志中是否有错误信息

### Q: 如何在生产环境中使用自己的域名？
A: 
1. 在 Resend 中添加并验证您的域名
2. 更新 `RESEND_FROM_EMAIL` 为 `noreply@yourdomain.com`
3. 配置 DNS 记录（DKIM, SPF, DMARC）

### Q: 邮件为什么会进入垃圾箱？
A:
1. 确保 DNS 记录配置正确
2. 避免在邮件中包含过多链接
3. 使用清晰的发件人名称和地址

---

## 📚 更多资源

- [Resend官方文档](https://resend.com/docs)
- [Resend SDK](https://github.com/resendlabs/resend-node)
- [邮件最佳实践](https://resend.com/docs/best-practices)

---

## ✅ 实施清单

- [ ] 获取 Resend API Key
- [ ] 配置 `.env.local` 文件
- [ ] 在订单创建API中添加邮件发送
- [ ] 在订单更新API中添加邮件发送
- [ ] 在订单取消API中添加邮件发送
- [ ] 测试各种邮件场景
- [ ] 部署到生产环境前验证邮件配置

---

**祝您使用愉快！** 🎉
