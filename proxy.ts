import { NextRequest, NextResponse } from 'next/server';

// 访问密码校验：cookie `accessCode` 与 env.ACCESS_CODE 比对。
// 未配置 ACCESS_CODE 时不设门禁，全放行。
export function proxy(req: NextRequest) {
  const expected = process.env.ACCESS_CODE;
  if (!expected) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('accessCode')?.value;
  if (cookie === expected) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

// 放行：login、api、静态资源、service worker、manifest、图标
export const config = {
  matcher: [
    '/((?!login|api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons|.*\\.(?:png|jpg|jpeg|svg|ico|webmanifest)$).*)',
  ],
};
