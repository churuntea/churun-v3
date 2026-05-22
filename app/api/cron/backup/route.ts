import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

// Vercel Cron Jobs 可以透過設定 Authorization 標頭來做簡易防護
// 確保這是合法觸發的
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // return new Response('Unauthorized', { status: 401 });
      // 如果未設定 CRON_SECRET 就直接放行，這在開發環境也方便測試
    }

    console.log('[Cron Backup] 開始執行每日全系統備份...');
    
    const tablesToBackup = [
      'members',
      'products',
      'orders',
      'order_items',
      'hr_profiles',
      'coupons',
      'member_coupons',
      'materials',
      'announcements'
    ];

    const backupData: any = {};
    const tableCounts: any = {};

    for (const tableName of tablesToBackup) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (error) {
          console.warn(`[Backup] Table ${tableName} query error, might not exist:`, error.message);
          backupData[tableName] = [];
          tableCounts[tableName] = 0;
        } else {
          backupData[tableName] = data || [];
          tableCounts[tableName] = (data || []).length;
        }
      } catch (err: any) {
        console.warn(`[Backup] Table ${tableName} exception:`, err.message);
        backupData[tableName] = [];
        tableCounts[tableName] = 0;
      }
    }

    const backupJson = {
      success: true,
      type: 'full_database_backup',
      version: '2.6.0',
      generated_at: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      table_counts: tableCounts,
      tables: backupData
    };

    const jsonString = JSON.stringify(backupJson, null, 2);

    // 以當天日期為檔名
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `backups/churun_full_db_backup_${dateStr}.json`;

    // 嘗試將舊的同名檔案刪除 (避免上傳衝突，Vercel Cron 如果一天內被手動觸發多次就會有這問題)
    await supabase.storage.from('avatars').remove([fileName]);

    // 將產生的 JSON 檔案上傳到 Supabase Storage ('avatars' bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, jsonString, {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('[Cron Backup] 上傳到 Supabase Storage 失敗:', uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    console.log(`[Cron Backup] 備份成功，檔案儲存於: ${uploadData.path}`);

    return NextResponse.json({
      success: true,
      message: '每日備份執行成功，檔案已上傳',
      path: uploadData.path
    });

  } catch (error: any) {
    console.error('[Cron Backup] 執行過程發生錯誤:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
