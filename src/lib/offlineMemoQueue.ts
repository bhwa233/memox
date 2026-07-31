import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { NewMemo, Note } from '@/api/type';
import type { LinkType } from '@/components/Editor/LinkAction';

const DATABASE_NAME = 'memox-offline';
const DATABASE_VERSION = 1;
const OUTBOX_STORE = 'new-memo-outbox';

interface PendingMemoCreate {
  operationId: string;
  memoId: string;
  content: string;
  link?: Pick<LinkType, 'url' | 'text'>;
  queuedAt: string;
}

interface OfflineMemoDatabase extends DBSchema {
  [OUTBOX_STORE]: {
    key: string;
    value: PendingMemoCreate;
  };
}

interface SyncResponse {
  success: boolean;
  data?: {
    memo?: Note;
  };
  error?: string;
}

export interface MemoSubmissionResult {
  memo: Note;
  status: 'queued' | 'synced';
}

export interface MemoFlushResult {
  synced: Note[];
  pending: number;
}

class SyncRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

let databasePromise: Promise<IDBPDatabase<OfflineMemoDatabase>> | undefined;
let flushPromise: Promise<MemoFlushResult> | undefined;

function getDatabase(): Promise<IDBPDatabase<OfflineMemoDatabase>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('当前浏览器不支持离线队列'));
  }

  if (!databasePromise) {
    databasePromise = openDB<OfflineMemoDatabase>(
      DATABASE_NAME,
      DATABASE_VERSION,
      {
        upgrade(database) {
          if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
            database.createObjectStore(OUTBOX_STORE, {
              keyPath: 'operationId',
            });
          }
        },
      },
    );
  }

  return databasePromise;
}

async function getPendingMemos(): Promise<PendingMemoCreate[]> {
  const database = await getDatabase();
  const memos = await database.getAll(OUTBOX_STORE);
  return memos.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

async function putPendingMemo(memo: PendingMemoCreate): Promise<void> {
  const database = await getDatabase();
  await database.put(OUTBOX_STORE, memo);
}

async function removePendingMemo(operationId: string): Promise<void> {
  const database = await getDatabase();
  await database.delete(OUTBOX_STORE, operationId);
}

function toPendingMemo(memo: NewMemo): PendingMemoCreate {
  return {
    operationId: crypto.randomUUID(),
    memoId: crypto.randomUUID(),
    content: memo.content.trim(),
    link: memo.link
      ? {
          url: memo.link.url,
          text: memo.link.text,
        }
      : undefined,
    queuedAt: new Date().toISOString(),
  };
}

function toLocalNote(memo: PendingMemoCreate): Note {
  return {
    id: memo.memoId,
    content: memo.content,
    images: [],
    createdAt: memo.queuedAt,
    updatedAt: memo.queuedAt,
    deletedAt: null,
    tags: [],
    link: memo.link
      ? {
          id: `pending-link-${memo.memoId}`,
          link: memo.link.url,
          text: memo.link.text,
          memoId: memo.memoId,
          createdAt: memo.queuedAt,
        }
      : undefined,
    syncState: 'pending',
  };
}

async function sendPendingMemo(pending: PendingMemoCreate): Promise<Note> {
  let response: Response;
  try {
    response = await fetch('/api/memos/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        operationId: pending.operationId,
        memoId: pending.memoId,
        content: pending.content,
        link: pending.link,
      }),
    });
  } catch {
    throw new SyncRequestError('网络不可用', true);
  }

  const data = (await response.json().catch(() => null)) as SyncResponse | null;
  if (!response.ok || !data?.success || !data.data?.memo) {
    throw new SyncRequestError(
      data?.error ?? '同步失败',
      response.status >= 500 || response.status === 0,
    );
  }

  return data.data.memo;
}

async function flushPendingMemos(): Promise<MemoFlushResult> {
  const pendingMemos = await getPendingMemos();
  const synced: Note[] = [];

  for (const pendingMemo of pendingMemos) {
    try {
      const memo = await sendPendingMemo(pendingMemo);
      await removePendingMemo(pendingMemo.operationId);
      synced.push(memo);
    } catch (error) {
      // Preserve this and following operations in their original order. A later
      // retry will safely reuse the same memo ID and operation ID.
      if (error instanceof SyncRequestError && !error.retryable) {
        console.error('离线笔记无法同步:', error.message);
      }
      break;
    }
  }

  return {
    synced,
    pending: (await getPendingMemos()).length,
  };
}

export async function submitNewTextOrLinkMemo(
  memo: NewMemo,
): Promise<MemoSubmissionResult> {
  const pendingMemo = toPendingMemo(memo);
  const localMemo = toLocalNote(pendingMemo);

  if (typeof navigator === 'undefined' || !navigator.onLine) {
    await putPendingMemo(pendingMemo);
    return { memo: localMemo, status: 'queued' };
  }

  try {
    const syncedMemo = await sendPendingMemo(pendingMemo);
    return { memo: syncedMemo, status: 'synced' };
  } catch (error) {
    if (error instanceof SyncRequestError && !error.retryable) {
      throw error;
    }

    await putPendingMemo(pendingMemo);
    return { memo: localMemo, status: 'queued' };
  }
}

export async function getQueuedNewMemoNotes(): Promise<Note[]> {
  return (await getPendingMemos()).map(toLocalNote);
}

export function flushNewMemoQueue(): Promise<MemoFlushResult> {
  if (!flushPromise) {
    flushPromise = flushPendingMemos().finally(() => {
      flushPromise = undefined;
    });
  }

  return flushPromise;
}
