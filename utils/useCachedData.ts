import { useState, useEffect, useCallback } from "react";
import { dbCache, fetchWithSWR } from "./dbCache";

interface UseCachedDataOptions<T> {
  ttl?: number;         // 快取過期時長（毫秒），預設為 60000 (1 分鐘)
  useLocal?: boolean;   // 是否同步至 LocalStorage 做跨頁持久化
  enabled?: boolean;    // 是否啟用（例如有些查詢需等待 userId 準備好）
  deps?: any[];         // 依賴陣列，若改變則重新讀取
}

/**
 * 智慧快取與背景同步 React Hook (useCachedData)
 * 
 * @param key 快取識別鍵值
 * @param fetcher 資料庫載入函數（回傳 Promise<T>）
 * @param options 設定選項
 * 
 * @returns { data, isLoading, isRevalidating, error, mutate, refresh }
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions<T> = {}
) {
  const { ttl = 60000, useLocal = false, enabled = true, deps = [] } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 1. 主要加載與同步函數
  const executeQuery = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    if (forceRefresh) {
      dbCache.invalidate(key);
    }

    const hasCache = dbCache.get<T>(key, useLocal) !== null;
    
    // 如果沒有快取，開啟主 loading
    if (!hasCache) {
      setIsLoading(true);
    } else {
      // 如果有快取，開啟背景 revalidating 指示
      setIsRevalidating(true);
    }

    try {
      const result = await fetchWithSWR<T>(key, fetcher, {
        ttl,
        useLocal,
        onBackgroundUpdate: (freshData) => {
          setData(freshData);
        },
      });

      setData(result);
      setError(null);
    } catch (err: any) {
      console.error(`[useCachedData] 加載失敗 [Key: ${key}]:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      setIsRevalidating(false);
    }
  }, [key, fetcher, ttl, useLocal, enabled, ...deps]);

  // 2. 監聽跨組件的快取狀態同步通知 (跨組件即時連動)
  useEffect(() => {
    if (!enabled) return;

    // 先讀取當前最新快取
    const currentCache = dbCache.get<T>(key, useLocal);
    if (currentCache !== null) {
      setData(currentCache);
      setIsLoading(false);
    }

    // 訂閱快取變更
    const unsubscribe = dbCache.subscribe(key, (updatedData: T) => {
      setData(updatedData);
    });

    return () => unsubscribe();
  }, [key, useLocal, enabled]);

  // 3. 組件掛載與依賴項更新時執行查詢
  useEffect(() => {
    if (enabled) {
      executeQuery();
    }
  }, [executeQuery, enabled]);

  // 4. 手動覆寫資料庫快取 (樂觀更新支援)
  const mutateData = useCallback((newData: T | ((prev: T | null) => T)) => {
    let resolvedData: T;
    if (typeof newData === "function") {
      const current = dbCache.get<T>(key, useLocal) || data;
      resolvedData = (newData as Function)(current);
    } else {
      resolvedData = newData;
    }
    
    dbCache.mutate(key, resolvedData, useLocal);
  }, [key, useLocal, data]);

  // 5. 手動重整與廢除快取 (強制從資料庫抓取最新)
  const refresh = useCallback(() => {
    return executeQuery(true);
  }, [executeQuery]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    mutate: mutateData,
    refresh,
  };
}
