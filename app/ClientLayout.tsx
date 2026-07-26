'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Main from './Main';
import NewMemoEditor from './NewMemoEditor';
import LeftSide from '@/components/LeftSide';
import MemoFilter from '@/components/MemoFilter';
import MobileHeader from '../src/components/MobileHeader';
import Tools from '@/components/Tools';
import useMemoStore from '@/store/memo';
import useCountStore from '@/store/count';
import { MemosCount, Note, TagWithCount } from '@/api/type';

// 首屏不显示的弹窗按需加载，剥离重依赖出首包
const ShareCardDialog = dynamic(
    () => import('@/components/ShareCard/ShareCardDialog').then((m) => m.ShareCardDialog),
    { ssr: false }
);
const AIInsightDialog = dynamic(
    () => import('@/components/AIInsightDialog').then((m) => m.AIInsightDialog),
    { ssr: false }
);
const AISearchDialog = dynamic(
    () => import('@/components/AISearchDialog').then((m) => m.AISearchDialog),
    { ssr: false }
);
const RandomWalkDialog = dynamic(
    () => import('@/components/RandomWalkDialog').then((m) => m.RandomWalkDialog),
    { ssr: false }
);

export interface InitialData {
    memos: Note[];
    total: number;
    tags: TagWithCount[];
    counts: MemosCount;
}

export default function ClientLayout({ initial }: { initial: InitialData }) {
    // 服务端数据注水到 store（首渲染前，一次性），避免客户端二次拉取与闪烁
    useState(() => {
        useMemoStore.getState().initializeWithServerData({
            items: initial.memos,
            total: initial.total,
        });
        useCountStore.getState().initializeWithServerData(initial.tags, initial.counts);
    });

    const [insightDialogOpen, setInsightDialogOpen] = useState(false);
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [hasInsights, setHasInsights] = useState(false);
    const [searchDialogOpen, setSearchDialogOpen] = useState(false);

    const handleInsightClick = () => {
        setInsightDialogOpen(true);
    };

    const handleSearchClick = () => {
        setSearchDialogOpen(true);
    };

    const handleInsightLoadingChange = (loading: boolean) => {
        setIsInsightLoading(loading);
    };

    const handleInsightGenerated = (hasData: boolean) => {
        setHasInsights(hasData);
    };

    return (
        <div className="flex flex-col md:flex-row max-w-[100vw] min-h-screen">
            <MobileHeader
                onInsightClick={handleInsightClick}
                isInsightLoading={isInsightLoading}
                hasInsights={hasInsights}
                onSearchClick={handleSearchClick}
            />
            <LeftSide
                onInsightClick={handleInsightClick}
                isInsightLoading={isInsightLoading}
                hasInsights={hasInsights}
                onSearchClick={handleSearchClick}
            />
            <div className="flex-1 md:ml-40 md:pl-6 px-4 overflow-hidden">
                <main className="flex flex-col h-full md:mr-60">
                    <div className="w-full md:mt-4 flex flex-col flex-grow overflow-hidden">
                        <div className="mb-2" id='edit'>
                            <NewMemoEditor />
                        </div>
                        <MemoFilter />
                        <section className="overflow-y-auto overflow-x-hidden flex-grow">
                            <Main />
                        </section>
                    </div>
                </main>
            </div>
            <ShareCardDialog />
            <AIInsightDialog
                open={insightDialogOpen}
                onOpenChange={setInsightDialogOpen}
                onLoadingChange={handleInsightLoadingChange}
                onInsightGenerated={handleInsightGenerated}
            />
            <AISearchDialog
                open={searchDialogOpen}
                onOpenChange={setSearchDialogOpen}
            />
            <RandomWalkDialog />

            {/* 更新的侧边栏 - 移除AI洞察按钮 */}
            <div className="hidden md:flex h-screen overflow-hidden group flex-col justify-start items-start transition-all px-4 py-4 w-60 fixed right-0 top-0">
                <Tools />
            </div>
        </div>
    );
}
