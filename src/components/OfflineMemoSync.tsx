'use client';

import { useCallback, useEffect } from 'react';
import useCountStore from '@/store/count';
import useMemoStore from '@/store/memo';
import {
  flushNewMemoQueue,
  getQueuedNewMemoNotes,
} from '@/lib/offlineMemoQueue';
import { useToast } from '@/components/ui/use-toast';

export default function OfflineMemoSync() {
  const { toast } = useToast();

  const flushQueue = useCallback(async () => {
    if (!navigator.onLine) {
      return;
    }

    try {
      const result = await flushNewMemoQueue();
      if (result.synced.length === 0) {
        return;
      }

      await Promise.all([
        useMemoStore.getState().fetchInitData(),
        useCountStore.getState().getCount(),
      ]);
      useCountStore.getState().fetchTags();

      toast({
        title:
          result.synced.length === 1
            ? '离线笔记已同步'
            : `${result.synced.length} 条离线笔记已同步`,
        description:
          result.pending > 0 ? `还有 ${result.pending} 条等待同步` : undefined,
      });
    } catch (error) {
      console.error('离线笔记队列同步失败:', error);
    }
  }, [toast]);

  const hydrateQueue = useCallback(async () => {
    try {
      const pendingMemos = await getQueuedNewMemoNotes();
      const memoStore = useMemoStore.getState();
      const countStore = useCountStore.getState();

      for (const memo of pendingMemos) {
        if (memoStore.addMemoToStore(memo).added) {
          countStore.updateCountsAfterMemoAdded(memo);
        }
      }

      await flushQueue();
    } catch (error) {
      console.error('无法恢复离线笔记队列:', error);
    }
  }, [flushQueue]);

  useEffect(() => {
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
