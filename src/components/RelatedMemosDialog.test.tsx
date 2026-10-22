import { afterEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/api/dbActions', () => ({}));
const { RelatedMemosDialog } = require('./RelatedMemosDialog');

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

// A response from an earlier memo must not replace the current dialog's data.
test('changing the memo discards a late response from the previous session', async () => {
  let finishPrevious: (value: unknown) => void = () => {};
  const response = (id: string) => ({ ok: true, json: async () => ({
    relatedMemos: [{ id, content: id, aiRelevanceScore: 0.8, tags: [], createdAt: null }],
    processingTime: 1, totalCount: 1,
  }) });
  const fetchMock = jest.fn<typeof fetch>()
    .mockImplementationOnce(() => new Promise((resolve) => { finishPrevious = resolve as typeof finishPrevious; }))
    .mockResolvedValueOnce(response('current-result') as Response);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = fetchMock;
  try {
    const { rerender } = render(<RelatedMemosDialog open memoId="previous" onOpenChange={() => {}} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    rerender(<RelatedMemosDialog open memoId="current" onOpenChange={() => {}} />);
    await screen.findByText('current-result');
    await act(async () => { finishPrevious(response('outdated-result')); });
    expect(screen.queryByText('outdated-result')).toBeNull();
    expect(screen.getByText('current-result')).toBeTruthy();
  } finally {
    globalThis.fetch = previousFetch;
  }
});
