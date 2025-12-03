import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, phone, category, region, website } = body;

    // 验证必填字段
    if (!id || !name || !email) {
      return NextResponse.json(
        { success: false, message: '供应商ID、名称和邮箱为必填项' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 检查供应商是否存在
    const existingSupplier = db.prepare('SELECT id FROM hust_library_supplier WHERE id = ?').get(id);
    if (!existingSupplier) {
      db.close();
      return NextResponse.json(
        { success: false, message: '供应商不存在' },
        { status: 404 }
      );
    }

    // 检查邮箱是否被其他供应商使用
    const emailConflict = db.prepare('SELECT id FROM hust_library_supplier WHERE email = ? AND id != ?').get(email, id);
    if (emailConflict) {
      db.close();
      return NextResponse.json(
        { success: false, message: '该邮箱已被其他供应商使用' },
        { status: 400 }
      );
    }

    // 更新供应商信息
    const result = db.prepare(`
      UPDATE hust_library_supplier 
      SET name = ?, email = ?, phone = ?, category = ?, region = ?, website = ?
      WHERE id = ?
    `).run(name, email, phone || null, category || null, region || null, website || null, id);

    db.close();

    return NextResponse.json({
      success: true,
      message: '供应商更新成功',
      data: {
        id,
        name,
        email,
        phone: phone || '未设置',
        category: category || '未分类',
        region: region || '中国',
        website: website || '未设置'
      }
    });
  } catch (error) {
    console.error('更新供应商时出错:', error);
    return NextResponse.json(
      { success: false, message: '更新供应商失败' },
      { status: 500 }
    );
  }
}
