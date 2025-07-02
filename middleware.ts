import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

const protectedRoutes = ["/feed", "/profile", "/settings"]
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value

  console.log("[Middleware] Rota acessada:", pathname)
  console.log("[Middleware] Token recebido:", token)

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !token) {
    console.log("[Middleware] Redirecionando para /login porque não tem token")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token) {
    try {
      jwt.verify(token, JWT_SECRET)
      console.log("[Middleware] Token válido")

      if (isAuthRoute) {
        console.log("[Middleware] Redirecionando para /feed porque usuário já está autenticado")
        return NextResponse.redirect(new URL("/feed", request.url))
      }
    } catch (err) {
      console.log("[Middleware] Token inválido ou expirado, deletando cookie")
      const res = isProtectedRoute
        ? NextResponse.redirect(new URL("/login", request.url))
        : NextResponse.next()

      res.cookies.delete("auth-token")
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}