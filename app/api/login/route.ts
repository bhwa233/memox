import { NextRequest, NextResponse } from 'next/server';

// 登录/迁移端点：校验密码后写 httpOnly cookie，供中间件与 RSC 读取。
export async function POST(req: NextRequest) {
  const { accessCode } = await req
    .json()
    .catch(() => ({ accessCode: '' as string }));

  const expected = process.env.ACCESS_CODE;

  // 已配置密码时必须匹配；未配置则视为无门禁，直接放行。
  if (expected && accessCode !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('accessCode', accessCode ?? '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
