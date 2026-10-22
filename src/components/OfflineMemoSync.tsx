'use client';

import { useCallback, useEffect, useRef } from 'react';
import useCountStore from '@/store/count';
import useMemoStore from '@/store/memo';
import useFilterStore from '@/store/filter';
import {
  flushNewMemoQueue,
  getQueuedNewMemoNotes,
} from '@/lib/offlineMemoQueue';
import { useToast } from '@/components/ui/use-toast';

export default function OfflineMemoSync() {
  const { toast } = useToast();
  const needsRefresh = useRef(false);
  const syncing = useRef(false);

  const restorePendingMemos = useCallback(async (
    countMode: 'added' | 'reset' | 'preserve' = 'added',
  ) => {
    const pendingMemos = await getQueuedNewMemoNotes();
    const memoStore = useMemoStore.getState();
    const countStore = useCountStore.getState();

    for (const memo of pendingMemos) {
      const { added } = memoStore.addMemoToStore(memo);
      if (countMode === 'reset' || (countMode === 'added' && added)) {
        countStore.updateCountsAfterMemoAdded(memo);
      }
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (!navigator.onLine || syncing.current) {
      return;
    }

    syncing.current = true;
    try {
      const result = await flushNewMemoQueue();
      if (result.synced.length === 0 && !needsRefresh.current) {
        return;
      }

      // A cached SSR response contains an old snapshot. Refresh the stores,
      // rather than reloading the document or waiting for another navigation.
      needsRefresh.current = true;
      let countsRefreshed = false;
      try {
        const results = await Promise.allSettled([
          useMemoStore.getState().fetchInitData(),
          useCountStore.getState().getCount(),
          useCountStore.getState().fetchTags(),
        ]);
        countsRefreshed = results[1].status === 'fulfilled';
        const failed = results.find((result) => result.status === 'rejected');
        if (failed?.status === 'rejected') throw failed.reason;
        needsRefresh.current = false;
      } finally {
        // Refreshing the list replaces its snapshot. Put any unsynced local
        // notes back even if only some of the reads succeeded.
        await restorePendingMemos(countsRefreshed ? 'reset' : 'preserve');
      }

      if (result.synced.length === 0) return;

      toast({
        title:
          result.synced.length === 1
            ? '离线笔记已同步'
            : `${result.synced.length} 条离线笔记已同步`,
        description:
          result.pending > 0 ? `还有 ${result.pending} 条等待同步` : undefined,
      });
    } catch (error) {
      console.error('笔记同步或缓存数据刷新失败:', error);
    } finally {
      syncing.current = false;
    }
  }, [restorePendingMemos, toast]);

  const hydrateQueue = useCallback(async () => {
    try {
      await restorePendingMemos();
      await flushQueue();
    } catch (error) {
      console.error('无法恢复离线笔记队列:', error);
    }
  }, [flushQueue, restorePendingMemos]);

  useEffect(() => {
    // Set by the worker only when it returns cached HTML, not on a normal SSR
    // load. Mounted inside ClientLayout so server-data initialization is done.
    const navigation = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    const cachedNavigation = navigation?.serverTiming?.some(
      (entry) => entry.name === 'memox-cache',
    ) ?? false;
    // Also restore the session's filter here so Main cannot race a second
    // initial read against cache recovery or offline queue synchronization.
    needsRefresh.current ||= cachedNavigation || useFilterStore.getState().hasFilter;

    void hydrateQueue();
    window.addEventListener('online', flushQueue);
    window.addEventListener('focus', flushQueue);

    return () => {
      window.removeEventListener('online', flushQueue);
      window.removeEventListener('focus', flushQueue);
    };
  }, [flushQueue, hydrateQueue]);

  return null;
}
