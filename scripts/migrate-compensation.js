const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('請設定環境變數 DATABASE_URL 或 SUPABASE_DB_URL，指向你的 Postgres 資料庫連線字串。');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, '..', 'migrations', '20260521_create_compensation_logs.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('找不到 migration 檔案：', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('連線成功，開始執行 migration...');
    await client.query(sql);
    console.log('Migration 執行完成。');
  } catch (err) {
    console.error('執行 migration 時發生錯誤：', err.message || err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

main();
