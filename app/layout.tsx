import './globals.css';
import 'react-photo-view/dist/react-photo-view.css';
import { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import OfflineMemoSync from '@/components/OfflineMemoSync';
import OfflineStatus from '@/components/OfflineStatus';

const APP_NAME = 'memos';
const APP_DEFAULT_TITLE = 'Memox';
const APP_TITLE_TEMPLATE = '%s - Memox';
const APP_DESCRIPTION = 'Quick notes,';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html suppressHydrationWarning>
        <head>
          {/* 图片 CDN 预连接，加速首屏图片加载（Turso 由服务端命中，无需浏览器预连接） */}
          <link
            rel="preconnect"
            href="https://gallery233.pages.dev"
            crossOrigin="anonymous"
          />
          <link rel="dns-prefetch" href="https://gallery233.pages.dev" />
        </head>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <OfflineMemoSync />
            <OfflineStatus />
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
