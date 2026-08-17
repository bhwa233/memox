import { Suspense } from 'react';
import ClientLayout from './ClientLayout';
import AppSkeleton from './AppSkeleton';
import {
  getMemosDataActions,
  getTagsWithCountAction,
  getCountAction,
} from '@/api/dbActions';
import { Desc } from '@/store/filter';
import type { MemosCount } from '@/api/type';

// Cache Components 下数据默认动态，无需 force-dynamic：
// 外壳预渲染成静态骨架，BootstrapData 的 DB 读取在请求时流式补上。
const EMPTY_COUNTS: MemosCount = {
  dailyStats: [],
  total: 0,
  daysCount: 0,
  totalWords: 0,
  lastUpdated: '',
};

// 首屏数据在服务端并行拉取，随 HTML 流式下发（首屏默认 filter）
// 用 allSettled 而非 all：任一子系统挂掉只丢自己那份数据，
// 不会把整页拖成 500 交给浏览器画原生错误页
async function BootstrapData() {
  const [memoResult, tagsResult, countsResult] = await Promise.allSettled([
    getMemosDataActions({ page: 1, desc: Desc.DESC }),
    getTagsWithCountAction(),
    getCountAction(),
  ]);

  if (memoResult.status === 'rejected') {
    console.error('[首屏] memo 列表加载失败:', memoResult.reason);
  }
  if (tagsResult.status === 'rejected') {
    console.error('[首屏] 标签加载失败:', tagsResult.reason);
  }
  if (countsResult.status === 'rejected') {
    console.error('[首屏] 统计数据加载失败:', countsResult.reason);
  }

  const memoData = memoResult.status === 'fulfilled' ? memoResult.value : null;

  return (
    <ClientLayout
      initial={{
        memos: memoData?.items ?? [],
        total: memoData?.total ?? 0,
        tags: tagsResult.status === 'fulfilled' ? tagsResult.value : [],
        counts:
          countsResult.status === 'fulfilled' ? countsResult.value : EMPTY_COUNTS,
      }}
    />
  );
}

// Suspense 兜底：骨架先 flush，DB 慢也不白屏；数据就绪后真实 UI 流式替换
export default function Home() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <BootstrapData />
    </Suspense>
  );
}
