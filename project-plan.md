# CHURUN 前端專案優化計畫

## 1. 專案概況

- 專案類型：Next.js 16 App Router 前端應用
- 資料來源：Supabase
- 主要用途：會員系統、訂單管理、錢包佣金、海報分享、通知與門市商店管理
- 目前狀態：以大型 client-side dashboard 為主，尚未建立統一開發流程、程式碼結構優化或 deploy 文檔
- 套件現況：已安裝 `antigravity`，但該套件為 npm placeholder，並非專案必需功能性依賴

## 2. 目標

- 讓專案具備穩定開發流程與可維護架構
- 將大型頁面拆解為可重用、可測試的 component
- 建立一致性的資料存取層與 Supabase 查詢策略
- 補齊開發、建置、部署與文件說明

## 3. 核心優化方向

### 3.1 產品與路由梳理

- 確認現有路由與頁面對應的商業功能
  - `app/admin/`
  - `app/orders/`
  - `app/store/`
  - `app/rewards/`
  - `app/profile/`
  - `app/login/`, `app/register/`
- 定義各頁面核心 KPI：會員轉換、訂單完成、分享導流、佣金結算
- 拆解首頁與 dashboard，避免單一大型頁面過於複雜

### 3.2 技術與結構優化

- 將 `app/page.tsx` 等大型頁面拆分為小型 component
- 建立 `lib/` 或 `services/` 資料存取層，統一 Supabase 查詢
- 明確 `client` / `server` 組件邊界，減少前端 bundle 體積
- 使用環境變數管理 Supabase URL/KEY、安全性與發佈設定
- 補強 `next.config.ts` 或 `vercel.json` 的部署設定

### 3.3 開發流程與品質控制

- 新增專案腳本
  - `dev`, `build`, `start`
  - `lint`, `type-check`, `format`, `audit`
- 實作 ESLint / Prettier 或 TypeScript 檢查
- 建立 README 與專案規劃文件
- 檢視依賴版本，處理可能的安全性警示

## 4. 優化階段

### 階段 1：現狀梳理與穩定基礎

- 盤點路由與資料表關聯
- 梳理 Supabase schema 與現有 SQL 檔案關係
- 補齊 `README` 與環境設定說明
- 建立開發腳本與基本 lint/type-check

### 階段 2：核心架構重構

- 拆分大型 UI 頁面
- 實作共用 component 與模組化資料層
- 清理或重構過度複雜的 client-side 邏輯
- 建立可重用的狀態管理與 UI 元件

### 階段 3：部署與運維強化

- 檢查 Vercel / Production 部署設定
- 優化資產與圖片載入策略
- 加入測試或自動化檢查流程
- 完成專案文檔與交付說明

## 5. 優先事項

1. 拆分 `app/page.tsx` 與首頁 dashboard
2. 建立 `app/supabase.ts` 以外的資料存取抽象層
3. 補齊 `package.json` 開發腳本
4. 寫出清楚的 `README` + `project-plan.md`- 補上 database migration 文檔與專用執行腳本5. 確認 `next.config.ts`、`vercel.json` 與環境變數

## 6. 推薦後續工作

- 專案文件：`project-plan.md`、`README.md`、`deployment.md`
- 組件架構：`components/` 分層、`app/` route 優化
- 資料層：`lib/supabase.ts` 或 `services/supabase.ts`
- 開發流程：`npm run lint`, `npm run type-check`, `npm run build`

## 7. 建議立即行動項目

- 建立專案演進清單，分成「必做」「可選」「未來」
- 找出現有 dashboard 中最常變更的邏輯，先拆解為 component
- 確認 Supabase 資料表和 `database_schema_*.sql` 的對應狀態
- 寫出一份簡短的開發說明，讓後續維護更容易
