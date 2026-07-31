import { NextRequest, NextResponse } from 'next/server';
import { createNewMemo, getMemoByIdAction } from '@/api/dbActions';
import type { NewMemo } from '@/api/type';
import type { LinkType } from '@/components/Editor/LinkAction';
import { requireWebSessionAuth } from '@/middleware/auth';

interface CreateMemoSyncRequest {
  operationId: string;
  memoId: string;
  content: string;
  link?: LinkType;
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128;
}

function parseCreateRequest(body: unknown): CreateMemoSyncRequest | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const candidate = body as Record<string, unknown>;
  if (!isIdentifier(candidate.operationId) || !isIdentifier(candidate.memoId)) {
    return null;
  }

  if (
    typeof candidate.content !== 'string' ||
    candidate.content.trim().length === 0
  ) {
    return null;
  }

  let link: LinkType | undefined;
  if (candidate.link !== undefined && candidate.link !== null) {
    if (!candidate.link || typeof candidate.link !== 'object') {
      return null;
    }

    const rawLink = candidate.link as Record<string, unknown>;
    if (typeof rawLink.url !== 'string') {
      return null;
    }

    link = {
      url: rawLink.url,
      text: typeof rawLink.text === 'string' ? rawLink.text : null,
    };
  }

  return {
    operationId: candidate.operationId,
    memoId: candidate.memoId,
    content: candidate.content.trim(),
    link,
  };
}

function response(memo: unknown, operationId: string, status: number) {
  return NextResponse.json(
    {
      success: true,
      data: { memo, operationId },
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

// POST /api/memos/sync only creates text/link memos. memoId is the idempotency key
// that lets the browser safely retry an IndexedDB outbox operation.
export async function POST(request: NextRequest) {
  const authError = requireWebSessionAuth(request);
  if (authError) {
    return authError;
  }

  const body = await request.json().catch(() => null);
  const input = parseCreateRequest(body);
  if (!input) {
    return NextResponse.json(
      {
        success: false,
        error: '请求参数无效',
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  const existingMemo = await getMemoByIdAction(input.memoId);
  if (existingMemo) {
    return response(existingMemo, input.operationId, 200);
  }

  const newMemo: NewMemo = {
    content: input.content,
    images: [],
    link: input.link,
  };

  try {
    const memo = await createNewMemo(newMemo, input.memoId);
    return response(memo, input.operationId, 201);
  } catch (error) {
    // A concurrent retry may have won the insert race. Re-read by the stable
    // client memo ID so retries remain idempotent.
    const memo = await getMemoByIdAction(input.memoId);
    if (memo) {
      return response(memo, input.operationId, 200);
    }

    console.error('POST /api/memos/sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建 memo 失败',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
