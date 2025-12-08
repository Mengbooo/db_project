import { NextResponse } from 'next/server';
import { sendSupplierPurchaseNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplierEmail, supplierName, bookTitle, quantity, purchaseOrderId, type = 'purchase' } = body;

    // 验证必填字段
    if (!supplierEmail || !supplierName) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：supplierEmail或supplierName' },
        { status: 400 }
      );
    }

    // 验证邮件类型和对应必填字段
    if (!['purchase', 'restock', 'contact'].includes(type)) {
      return NextResponse.json(
        { success: false, error: '无效的邮件类型，必须是 purchase、restock 或 contact' },
        { status: 400 }
      );
    }

    if (!bookTitle || !quantity || !purchaseOrderId) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：bookTitle、quantity、purchaseOrderId' },
        { status: 400 }
      );
    }

    // 使用统一的函数发送所有类型的邮件
    await sendSupplierPurchaseNotificationEmail(
      supplierEmail,
      supplierName,
      bookTitle,
      quantity,
      purchaseOrderId,
      type as 'purchase' | 'restock' | 'contact'
    );

    return NextResponse.json({
      success: true,
      message: '供应商邮件已发送'
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
