import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bỏ qua kiểm tra cho /play, /login, các file tĩnh và API
  if (
    pathname.startsWith('/play') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Lấy mật khẩu mong muốn từ biến môi trường (mặc định là "matkhau")
  const expectedPassword = process.env.ADMIN_PASSWORD || 'matkhau';
  
  // Đọc cookie game_auth
  const authCookie = request.cookies.get('game_auth');
  if (authCookie?.value === expectedPassword) {
    return NextResponse.next();
  }

  // Nếu không trùng khớp, chuyển hướng về trang /login và đính kèm đường dẫn cũ
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn ngoại trừ:
     * - api (các API route)
     * - _next/static (các file tĩnh của Next.js)
     * - _next/image (tối ưu hóa hình ảnh)
     * - favicon.ico (icon website)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
