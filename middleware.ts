import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

// Rotas protegidas
const protectedRoutes = ["/feed", "/profile", "/settings", "/messages"]

// Rotas públicas para login/cadastro
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      console.log("✅ Token válido:", decoded)

      if (isAuthRoute) {
        // Usuário logado tenta acessar página de login → redirecione
        return NextResponse.redirect(new URL("/feed", request.url))
      }

      return NextResponse.next()
    } catch (e: any) {
      console.error("❌ Token inválido:", e.message)

      // Se for TokenExpiredError ou JsonWebTokenError
      const response = isProtected
        ? NextResponse.redirect(new URL("/login", request.url))
        : NextResponse.next()

      response.cookies.delete("auth-token")
      return response
    }
  } else {
    if (isProtected) {
      console.log("🔒 Tentativa de acesso sem token")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
