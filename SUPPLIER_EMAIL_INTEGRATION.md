# 供应商采购通知邮件集成说明

## 已完成的集成

### 1. 邮件模板
- ✅ 位置：`lib/email.ts` 中的 `sendSupplierPurchaseNotificationEmail` 函数
- ✅ 样式：深色主题，与其他邮件统一
- ✅ 内容：包含采购单号、图书名称、采购数量

### 2. 邮件 API
- ✅ 位置：`app/api/email/send/route.ts`
- ✅ 类型：`supplier_notification`
- ✅ 独立端点：`app/api/email/supplier/route.ts`（可选）

## 前端调用方式

### 方式一：使用统一邮件 API（推荐）

在 `app/admin/dashboard/page.tsx` 的以下两个函数中添加邮件发送：

#### 1. 缺书与采购tab的"联系供应商"按钮

```typescript
// 位置：handleContactSupplier 函数（约852行）
const handleContactSupplier = async (orderId: string, supplierName: string, supplierEmail: string, currentStatus: string) => {
  try {
    // 获取采购单详细信息
    const orderDetails = purchaseOrders.find(order => order.id === orderId);
    
    if (!orderDetails) {
      toast.error('采购单不存在');
      return;
    }

    // 发送供应商采购通知邮件
    const emailResponse = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'supplier_notification',
        email: 'dummy@example.com', // API要求，但不使用
        supplierEmail: supplierEmail,
        supplierName: supplierName,
        bookTitle: orderDetails.bookTitle || '未知图书',
        quantity: orderDetails.quantity,
        purchaseOrderId: orderId,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResult.success) {
      console.error('发送邮件失败:', emailResult.error);
    }

    // 后续原有逻辑...（更新采购单状态等）
    if (currentStatus === '待处理') {
      // ... 原有代码
      toast.success(`已联系供应商${supplierName}补货`, {
        description: `邮箱: ${supplierEmail} | 采购通知邮件已发送`,
        duration: 3000,
      });
    } else {
      toast.success(`已联系供应商${supplierName}补货`, {
        description: `邮箱: ${supplierEmail} | 采购通知邮件已发送`,
        duration: 3000,
      });
    }
  } catch (error) {
    console.error('联系供应商时出错:', error);
    toast.error('联系供应商时发生错误');
  }
};
```

#### 2. 供应商tab的"通知补货"按钮

```typescript
// 位置：handleNotifyRestock 函数（约840行）
const handleNotifyRestock = async (supplierId: string, supplierName: string, supplierEmail: string) => {
  try {
    // 这里需要确定要采购的图书和数量
    // 方案A：弹出对话框让管理员输入
    // 方案B：默认采购特定图书

    // 示例：发送邮件
    const emailResponse = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'supplier_notification',
        email: 'dummy@example.com',
        supplierEmail: supplierEmail,
        supplierName: supplierName,
        bookTitle: '待确认图书', // 需要根据实际情况填写
        quantity: 10, // 需要根据实际情况填写
        purchaseOrderId: 'TEMP-' + Date.now(), // 临时采购单号
      }),
    });

    const result = await emailResponse.json();

    if (result.success) {
      setNotificationSupplier(supplierId);
      toast.success(`已通知${supplierName}补货`, {
        description: `采购通知邮件已发送至 ${supplierEmail}`,
        duration: 3000,
      });

      setTimeout(() => {
        setNotificationSupplier(null);
      }, 2000);
    } else {
      toast.error('发送邮件失败');
    }
  } catch (error) {
    console.error('通知补货失败:', error);
    toast.error('通知补货时发生错误');
  }
};
```

### 方式二：使用独立API端点

```typescript
const emailResponse = await fetch('/api/email/supplier', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    supplierEmail: supplierEmail,
    supplierName: supplierName,
    bookTitle: orderDetails.bookTitle,
    quantity: orderDetails.quantity,
    purchaseOrderId: orderId,
  }),
});
```

## 测试方法

### PowerShell测试

```powershell
$body = @{
    type = "supplier_notification"
    email = "dummy@example.com"
    supplierEmail = "supplier@example.com"
    supplierName = "测试供应商"
    bookTitle = "深入理解计算机系统"
    quantity = 50
    purchaseOrderId = "PUR-0001"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/email/send" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

## 注意事项

1. **供应商tab的"通知补货"按钮**需要额外的逻辑来确定采购的图书和数量
2. **缺书tab的"联系供应商"按钮**已经有采购单信息，可以直接调用
3. 邮件发送是异步的，不影响主流程
4. 需要在 `.env.local` 中配置 Resend API Key

## 邮件内容预览

邮件将包含：
- Logo
- 采购单号（等宽字体高亮）
- 图书名称
- 采购数量
- 供应商专属Footer链接
- 专业的深色主题设计
