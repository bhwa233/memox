import { Suspense } from 'react';
import ClientLayout from './ClientLayout';
import AppSkeleton from './AppSkeleton';
import {
  getMemosDataActions,
  getTagsWithCountAction,
  getCountAction,
} from '@/api/dbActions';
import { Desc } from '@/store/filter';

// 每次请求实时渲染：数据要新、页面在鉴权后，禁止静态缓存
export const dynamic = 'force-dynamic';

// 首屏数据在服务端并行拉取，随 HTML 流式下发（首屏默认 filter）
async function BootstrapData() {
  const [memoData, tags, counts] = await Promise.all([
    getMemosDataActions({ page: 1, desc: Desc.DESC }),
    getTagsWithCountAction(),
    getCountAction(),
  ]);

  return (
    <ClientLayout
      initial={{
        memos: memoData?.items ?? [],
        total: memoData?.total ?? 0,
        tags,
        counts,
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
