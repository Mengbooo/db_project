import { NextResponse } from 'next/server';
import { sendSupplierPurchaseNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplierEmail, supplierName, bookTitle, quantity, purchaseOrderId } = body;

    // 验证必填字段
    if (!supplierEmail || !supplierName || !bookTitle || !quantity || !purchaseOrderId) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 发送邮件
    await sendSupplierPurchaseNotificationEmail(
      supplierEmail,
      supplierName,
      bookTitle,
      quantity,
      purchaseOrderId
    );

    return NextResponse.json({
      success: true,
      message: '供应商采购通知邮件已发送'
    });
  } catch (error) {
    console.error('发送供应商邮件失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '发送邮件失败' 
      },
      { status: 500 }
    );
  }
}
