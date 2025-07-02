import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

// Rotas que precisam de autenticação
const protectedRoutes = ["/feed", "/profile", "/settings", "/messages", "/notifications", "/search"]

// Rotas que usuários logados não devem acessar
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value

  console.log("🛡️ Middleware executando para:", pathname)
  console.log("🍪 Token encontrado:", !!token)

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  console.log("🔒 É rota protegida:", isProtectedRoute)
  console.log("🔑 É rota de auth:", isAuthRoute)

  // Se é rota protegida e não tem token, redireciona para login
  if (isProtectedRoute && !token) {
    console.log("❌ Sem token em rota protegida, redirecionando para login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Se tem token, verificar se é válido
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      console.log("✅ Token válido:", !!decoded)

      // Se está logado e tenta acessar login/register, redireciona para feed
      if (isAuthRoute) {
        console.log("🔄 Usuário logado tentando acessar auth route, redirecionando para feed")
        return NextResponse.redirect(new URL("/feed", request.url))
      }
    } catch (error) {
      console.log("❌ Token inválido:", error)

      // Token inválido, remove o cookie e redireciona para login se necessário
      const response = isProtectedRoute ? NextResponse.redirect(new URL("/login", request.url)) : NextResponse.next()

      response.cookies.delete("auth-token")
      return response
    }
  }

  console.log("✅ Middleware permitindo acesso")
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
