'use client';
import React from 'react';
import Editor from '@/components/Editor';
import { useRequest, useSessionStorageState } from 'ahooks';
import { createNewMemo } from '../src/api/dbActions';
import { submitNewTextOrLinkMemo } from '@/lib/offlineMemoQueue';
import type { NewMemo } from '@/api/type';
import useMemoStore from '../src/store/memo';
import useCountStore from '../src/store/count';
import { useToast } from '../src/components/ui/use-toast';
import { startConfettiAnimation } from '../src/lib/utils';

const EDITOR_CACHE_KEY = 'memo-editor-cache';

const NewMemoEditor: React.FC = () => {
  const [editorCache, setEditorCache] = useSessionStorageState<{
    content: string;
    images: string[];
  }>(EDITOR_CACHE_KEY, {
    defaultValue: { content: '', images: [] },
  });

  const { addMemoToStore, updateMemo } = useMemoStore();
  const { updateCountsAfterMemoAdded } = useCountStore();
  const { toast } = useToast();

  // Simplified update cache function
  const updateCache = (content: string, images: string[] = []) => {
    setEditorCache({ content, images });
  };

  // Clear cache after successful submission
  const clearCache = () => {
    setEditorCache({ content: '', images: [] });
  };

  const createMemo = async (newMemo: NewMemo) => {
    // 图片仍走现有的即时上传链路；本阶段只保证纯文本和链接离线入队。
    if (newMemo.images?.length) {
      return { memo: await createNewMemo(newMemo), status: 'synced' as const };
    }

    return submitNewTextOrLinkMemo(newMemo);
  };

  const { runAsync: createRecord } = useRequest(createMemo, {
    manual: true,
    onSuccess: async ({ memo: newMemo, status }) => {
      // 转换link字段的类型：null -> undefined
      const noteForStore = {
        ...newMemo,
        link: newMemo.link || undefined,
      };
      addMemoToStore(noteForStore);
      // 更新计数统计
      updateCountsAfterMemoAdded(noteForStore);
      toast({
        title: status === 'queued' ? '已加入离线发送队列' : '创建成功',
        description:
          status === 'queued' ? '恢复网络后会自动发送' : '已成功创建新笔记',
      });
      clearCache();
      if (status === 'queued') {
        return;
      }

      startConfettiAnimation();
      // 延迟3秒后更新memo以获取新生成的标签
      setTimeout(async () => {
        try {
          updateMemo(newMemo.id);
          console.log(`更新memo ${newMemo.id} 以获取最新标签`);
        } catch (error) {
          console.error('延迟更新memo失败:', error);
        }
      }, 3000);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '发送失败',
        description: '笔记内容已保留，请稍后重试',
      });
    },
  });

  return (
    <Editor
      onSubmit={createRecord}
      defaultValue={editorCache?.content || ''}
      defaultImages={editorCache?.images || []}
      onChange={updateCache}
    />
  );
};

export default NewMemoEditor;
