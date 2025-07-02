import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  const isLoginPage = pathname === "/login" || pathname === "/register";
  const isProtectedPage = ["/feed", "/profile", "/settings", "/messages", "/notifications"].some(p =>
    pathname.startsWith(p)
  );

  // Se estiver logado e tentar acessar login ou register, redireciona pro feed
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Se não estiver logado e tentar acessar rota protegida, vai pro login
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Deixa passar normalmente
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};