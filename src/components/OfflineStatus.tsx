'use client';

import { useEffect, useState } from 'react';

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateNetworkStatus = () => setIsOffline(!navigator.onLine);

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow"
    >
      当前处于离线状态，正在显示最近缓存的内容。
    </div>
  );
}
