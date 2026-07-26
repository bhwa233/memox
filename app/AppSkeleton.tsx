// 首屏 Suspense 兜底骨架：贴近真实布局，立即 flush，避免白屏
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-md border border-border bg-card p-4 space-y-3">
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

export default function AppSkeleton() {
  return (
    <div className="flex flex-col md:flex-row max-w-[100vw] min-h-screen">
      {/* 左侧栏占位 */}
      <div className="hidden md:block w-40 fixed left-0 top-0 h-screen px-4 py-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-28 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
      </div>

      <div className="flex-1 md:ml-40 md:pl-6 px-4 overflow-hidden">
        <main className="flex flex-col h-full md:mr-60">
          <div className="w-full md:mt-4 flex flex-col flex-grow">
            {/* 编辑器占位 */}
            <div className="mb-2 animate-pulse h-28 w-full rounded-md border border-border bg-card" />
            {/* 列表骨架 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* 右侧工具栏占位 */}
      <div className="hidden md:block w-60 fixed right-0 top-0 h-screen px-4 py-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-24 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
