'use client';
import useMemoStore from '@/store/memo';
import InfiniteScroll from 'react-infinite-scroll-component';
import useConfigStore from '@/store/config';
import WaterfallList from '../src/components/MemoView/WaterfallList';
import { PhotoProvider } from 'react-photo-view';

// 骨架卡片占位
function MemoSkeleton() {
    return (
        <div className="animate-pulse rounded-md border border-border bg-card p-4 space-y-3">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
    );
}

export default function Main() {
    const { memos = [], fetchPagedData, databases, isLoading } = useMemoStore();
    const { config } = useConfigStore();
    const { isSimpleMode } = config.generalConfig;

    // Initial filter restoration and cached-page recovery share one read in
    // OfflineMemoSync, after server-data initialization and queue hydration.

    // 首次加载且暂无数据时显示骨架屏
    if (isLoading && memos.length === 0) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                {Array.from({ length: 6 }).map((_, i) => (
                    <MemoSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <PhotoProvider>
            <InfiniteScroll
                dataLength={memos?.length || 0}
                next={fetchPagedData}
                hasMore={databases.total > (memos?.length || 0)}
                loader={
                    <p className="text my-4 text-center text-muted-foreground">
                        <b>Loading...</b>
                    </p>
                }
                endMessage={
                    <p className="text my-4 text-center text-muted-foreground">
                        <b>---- 已加载 {memos.length} 条笔记 ----</b>
                    </p>
                }
                scrollThreshold={0.8}
            >
                <WaterfallList memos={memos} isSimpleMode={isSimpleMode} />
            </InfiniteScroll>
        </PhotoProvider>
    );
}
