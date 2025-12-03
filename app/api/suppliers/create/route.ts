import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, category, region, website } = body;

    // 验证必填字段
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: '供应商名称和邮箱为必填项' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 检查邮箱是否已存在
    const existingSupplier = db.prepare('SELECT id FROM hust_library_supplier WHERE email = ?').get(email);
    if (existingSupplier) {
      db.close();
      return NextResponse.json(
        { success: false, message: '该邮箱已被使用' },
        { status: 400 }
      );
    }

    // 插入新的供应商
    const result = db.prepare(`
      INSERT INTO hust_library_supplier (name, email, phone, category, region, website)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email, phone || null, category || null, region || null, website || null);

    db.close();

    return NextResponse.json({
      success: true,
      message: '供应商创建成功',
      data: {
        id: result.lastInsertRowid,
        name,
        email,
        phone: phone || '未设置',
        category: category || '未分类',
        region: region || '中国',
        website: website || '未设置'
      }
    });
  } catch (error) {
    console.error('创建供应商时出错:', error);
    return NextResponse.json(
      { success: false, message: '创建供应商失败' },
      { status: 500 }
    );
  }
}
