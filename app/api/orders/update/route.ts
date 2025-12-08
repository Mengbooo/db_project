import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { sendOrderStatusEmail } from '@/lib/email';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    // 验证必填字段
    if (!orderId || !status) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证订单状态 - admin只能修改为待出库/运输中/已送达
    const allowedAdminStatuses = ['待出库', '运输中', '已送达'];
    if (!allowedAdminStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `无效的订单状态。允许的状态为: ${allowedAdminStatuses.join('、')}` },
        { status: 400 }
      );
    }

    // 仏orderId中提取数字ID (例如: "ORD-0001" -> 1)
    const id = parseInt(orderId.replace('ORD-', ''));

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '无效的订单ID' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    let isTransactionActive = false;
    
    try {
      // 首先获取当前订单信息
      const currentOrder: any = db.prepare('SELECT * FROM hust_library_ticket WHERE id = ?').get(id);
      
      if (!currentOrder) {
        db.close();
        return NextResponse.json(
          { success: false, message: '订单不存在' },
          { status: 404 }
        );
      }
      
      // 开始事务
      db.prepare('BEGIN').run();
      isTransactionActive = true;
      
      try {
        // 更新订单状态
        const result = db.prepare(
          'UPDATE hust_library_ticket SET status = ? WHERE id = ?'
        ).run(status, id);

        if (result.changes === 0) {
          db.prepare('ROLLBACK').run();
          isTransactionActive = false;
          db.close();
          return NextResponse.json(
            { success: false, message: '订单不存在或未发生更改' },
            { status: 404 }
          );
        }

        // 如果订单被取消，且关联了采购单，则级联取消采购单
        if (status === '已取消' && currentOrder.status !== '已取消') {
          // 如果订单关联了采购单（待补货订单）
          if (currentOrder.purchase_id) {
            // 获取关联的采购单
            const linkedPurchase: any = db.prepare('SELECT * FROM hust_library_purchase WHERE id = ?').get(currentOrder.purchase_id);
            
            if (linkedPurchase && linkedPurchase.status === '待处理') {
              // 取消采购单
              db.prepare('UPDATE hust_library_purchase SET status = ? WHERE id = ?').run('已取消', currentOrder.purchase_id);
            }
          }
          
          // 退款给用户（待补货订单已经扣款了）
          if (currentOrder.status === '待补货') {
            db.prepare(`
              UPDATE hust_library_user_profile 
              SET balance = balance + ?
              WHERE auth_id = ?
            `).run(currentOrder.price, currentOrder.reader_id);
          }
          
          // 如果是正常订单（已扣库存），需要恢复库存
          if (currentOrder.status === '待出库' || currentOrder.status === '已发货') {
            db.prepare('UPDATE hust_library_book SET stock = stock + ? WHERE id = ?').run(currentOrder.quantity, currentOrder.book_id);
            // 退款给用户
            db.prepare(`
              UPDATE hust_library_user_profile 
              SET balance = balance + ?
              WHERE auth_id = ?
            `).run(currentOrder.price, currentOrder.reader_id);
          }
        }

        // 提交事务
        db.prepare('COMMIT').run();
        isTransactionActive = false;

        // 获取用户信息用于发送邮件
        const userInfo: any = db.prepare(`
          SELECT u.email, u.username 
          FROM hust_library_user_auth u
          WHERE u.id = ?
        `).get(currentOrder.reader_id);

        db.close();

        // 发送订单状态更新邮件（异步，不阻塞响应）
        if (userInfo && userInfo.email && status !== currentOrder.status) {
          const statusMessages: Record<string, string> = {
            '待出库': '您的订单已确认，正在准备出库',
            '运输中': '您的订单已发出，预计3天内送达',
            '已送达': '您的订单已送达，感谢您的购买！',
            '已取消': '您的订单已取消，款项已退回',
          };

          sendOrderStatusEmail(
            userInfo.email,
            userInfo.username,
            orderId,
            status,
            statusMessages[status] || '订单状态已更新'
          ).catch(error => {
            console.error('发送订单状态邮件失败:', error);
            // 不阻塞响应，只记录错误
          });
        }

        return NextResponse.json({
          success: true,
          message: '订单状态更新成功'
        });
      } catch (innerError) {
        // 只有事务活跃时才回滚
        if (isTransactionActive) {
          db.prepare('ROLLBACK').run();
          isTransactionActive = false;
        }
        throw innerError;
      }

    } catch (error) {
      db.close();
      throw error;
    }

  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '更新订单失败' },
      { status: 500 }
    );
  }
}
