# 🚀 Resend 邮件服务快速开始

## 5分钟快速集成

### 1️⃣ 获取API Key（1分钟）

```bash
# 访问 https://resend.com
# 注册 → API Keys → 复制 API Key
```

### 2️⃣ 配置环境变量（1分钟）

创建 `.env.local` 文件：

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3️⃣ 发送测试邮件（1分钟）

#### macOS / Linux 用户

使用 cURL 测试：

```bash
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "email": "your-email@example.com",
    "username": "Test User"
  }'
```

#### Windows PowerShell 用户（推荐）

**方法1：PowerShell Invoke-WebRequest（最稳妥）** ✅

```powershell
$body = @{
    type = "welcome"
    email = "your-email@example.com"
    username = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/email/send" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

**方法2：使用 JSON 文件**

创建 `test-email.json` 文件：
```json
{
  "type": "welcome",
  "email": "your-email@example.com",
  "username": "Test User"
}
```

然后在 PowerShell 中运行：
```powershell
curl -X POST http://localhost:3001/api/email/send `
  -H "Content-Type: application/json" `
  -d @test-email.json
```

**方法3：cURL 转义（需要转义所有引号）**

```powershell
curl -X POST http://localhost:3001/api/email/send -H "Content-Type: application/json" -d "{\"type\":\"welcome\",\"email\":\"your-email@example.com\",\"username\":\"Test User\"}"
```

### 4️⃣ 在业务中集成（2分钟）

#### 订单创建时发送确认邮件

在 `/app/api/orders/create/route.ts` 中添加：

```typescript
// 订单创建成功后，发送邮件
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'order_confirmation',
    email: user.email,
    username: user.full_name || user.username,
    orderId: 'ORD-' + order.id,
    items: bookNames.join(', '),
    total: totalPrice,
    address: orderAddress
  })
});
```

#### 订单取消时发送退款邮件

在 `/app/api/orders/cancel/route.ts` 中添加：

```typescript
// 订单取消成功后，发送邮件
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'order_cancellation',
    email: user.email,
    username: user.full_name || user.username,
    orderId: 'ORD-' + order.id,
    refundAmount: order.price
  })
});
```

---

## 📧 支持的邮件类型

| 类型 | 说明 | 必填字段 |
|------|------|---------|
| `welcome` | 欢迎邮件 | email, username |
| `order_confirmation` | 订单确认 | email, orderId, items, total, address |
| `order_status` | 订单状态更新 | email, orderId, status |
| `order_cancellation` | 订单取消 | email, orderId, refundAmount |
| `supplier_notification` | 供应商通知 | supplierEmail, supplierName, bookTitle, quantity, purchaseOrderId |

---

## ✅ 完整集成清单

- [ ] 安装依赖: `npm install resend` ✅ 已完成
- [ ] 创建邮件库: `lib/email.ts` ✅ 已完成
- [ ] 创建API端点: `app/api/email/send/route.ts` ✅ 已完成
- [ ] 配置环境变量: `.env.local`
  - [ ] 获取 Resend API Key
  - [ ] 填入 RESEND_API_KEY
  - [ ] 设置 RESEND_FROM_EMAIL
  - [ ] 配置 NEXT_PUBLIC_APP_URL
- [ ] 在订单创建API中添加邮件发送
- [ ] 在订单更新API中添加邮件发送
- [ ] 在订单取消API中添加邮件发送
- [ ] 在注册API中添加欢迎邮件
- [ ] 测试所有邮件场景
- [ ] 部署到生产环境

---

## 🧪 测试邮件

### 使用测试客户端

推荐使用 REST Client (VS Code 插件)，创建 `test.http` 文件：

```http
### 发送欢迎邮件
POST http://localhost:3001/api/email/send
Content-Type: application/json

{
  "type": "welcome",
  "email": "user@example.com",
  "username": "张三"
}

### 发送订单确认邮件
POST http://localhost:3001/api/email/send
Content-Type: application/json

{
  "type": "order_confirmation",
  "email": "user@example.com",
  "username": "张三",
  "orderId": "ORD-0001",
  "items": "The Art of Code, Deep Work",
  "total": 128.50,
  "address": "北京市朝阳区XXX"
}

### 发送订单取消邮件
POST http://localhost:3001/api/email/send
Content-Type: application/json

{
  "type": "order_cancellation",
  "email": "user@example.com",
  "username": "张三",
  "orderId": "ORD-0001",
  "refundAmount": 128.50
}
```

---

## 🔍 调试与故障排除

### 查看邮件发送日志

在浏览器开发者工具 → Network 标签中查看 `/api/email/send` 的请求和响应。

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `缺少必填字段` | 少传了必要参数 | 检查请求体中的必填字段 |
| `Invalid API Key` | API Key不正确 | 检查 `.env.local` 中的 RESEND_API_KEY |
| `From email not verified` | 发件人未验证 | 在生产环境中验证自己的域名 |
| `Daily limit exceeded` | 超出免费额度(100封/天) | 升级到付费计划 |

---

## 💡 最佳实践

1. **异步发送** - 邮件发送失败不应阻止主业务流程
2. **错误处理** - 始终捕获邮件发送异常
3. **日志记录** - 记录所有邮件发送尝试
4. **模板管理** - 考虑使用 Resend 的模板功能
5. **退订机制** - 提供邮件退订链接

---

## 📚 更多帮助

- 完整指南: 查看 `MAIL_SERVICE_GUIDE.md`
- 邮件工具库: `lib/email.ts`
- API端点: `app/api/email/send/route.ts`
- [Resend官方文档](https://resend.com/docs)

---

**现在就开始发送邮件吧！** 🎉
