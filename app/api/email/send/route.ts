import { NextResponse } from 'next/server';
import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendOrderCancellationEmail,
  sendSupplierPurchaseNotificationEmail,
} from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, email, username, orderId, items, total, address, status, statusMessage, refundAmount, supplierEmail, supplierName, bookTitle, quantity, purchaseOrderId } = body;

    // 验证必填字段
    if (!type || !email) {
      return NextResponse.json(
        { error: '缺少必填字段: type 和 email' },
        { status: 400 }
      );
    }

    // 根据邮件类型发送不同的邮件
    switch (type) {
      case 'welcome':
        if (!username) {
          return NextResponse.json(
            { error: '欢迎邮件需要 username 字段' },
            { status: 400 }
          );
        }
        await sendWelcomeEmail(email, username);
        return NextResponse.json({
          success: true,
          message: '欢迎邮件已发送',
        });

      case 'order_confirmation':
        if (!orderId || !items || !total || !address) {
          return NextResponse.json(
            { error: '订单确认邮件需要 orderId, items, total, address 字段' },
            { status: 400 }
          );
        }
        await sendOrderConfirmationEmail(email, username || '用户', orderId, items, total, address);
        return NextResponse.json({
          success: true,
          message: '订单确认邮件已发送',
        });

      case 'order_status':
        if (!orderId || !status) {
          return NextResponse.json(
            { error: '订单状态邮件需要 orderId 和 status 字段' },
            { status: 400 }
          );
        }
        await sendOrderStatusEmail(email, username || '用户', orderId, status, statusMessage || '您的订单状态已更新');
        return NextResponse.json({
          success: true,
          message: '订单状态邮件已发送',
        });

      case 'order_cancellation':
        if (!orderId || refundAmount === undefined) {
          return NextResponse.json(
            { error: '取消订单邮件需要 orderId 和 refundAmount 字段' },
            { status: 400 }
          );
        }
        await sendOrderCancellationEmail(email, username || '用户', orderId, refundAmount);
        return NextResponse.json({
          success: true,
          message: '取消订单邮件已发送',
        });

      case 'supplier_notification':
        if (!supplierEmail || !supplierName || !bookTitle || !quantity || !purchaseOrderId) {
          return NextResponse.json(
            { error: '供应商通知邮件需要 supplierEmail, supplierName, bookTitle, quantity, purchaseOrderId 字段' },
            { status: 400 }
          );
        }
        await sendSupplierPurchaseNotificationEmail(supplierEmail, supplierName, bookTitle, quantity, purchaseOrderId);
        return NextResponse.json({
          success: true,
          message: '供应商通知邮件已发送',
        });

      default:
        return NextResponse.json(
          { error: `未知的邮件类型: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('邮件API错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '邮件发送失败' },
      { status: 500 }
    );
  }
}
