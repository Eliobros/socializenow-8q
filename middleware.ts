import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

// Segredo usado para assinar e validar o token JWT
const JWT_SECRET = process.env.JWT_SECRET || "secret"

// Rotas protegidas — acesso só com login
const protectedRoutes = ["/feed", "/profile", "/settings", "/messages", "/notifications", "/search"]

// Rotas públicas de autenticação
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pega o token do cookie
  const token = request.cookies.get("auth-token")?.value

  // Logs pra debug — você pode ver isso no terminal do Next.js
  console.log("🛡️ Middleware executado para:", pathname)
  console.log("🍪 Token disponível:", !!token)

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (token) {
    try {
      // Verifica se o token é válido
      const decoded = jwt.verify(token, JWT_SECRET)
      console.log("✅ Token válido:", decoded)

      // Se for rota de login e usuário estiver logado, redireciona para feed
      if (isAuthRoute) {
        return NextResponse.redirect(new URL("/feed", request.url))
      }

      // Acesso permitido
      return NextResponse.next()
    } catch (e: any) {
      // Erro ao validar token
      console.error("❌ Token inválido:", e.message)

      // Se for expirado ou malformado, remove o cookie
      const response = isProtected
        ? NextResponse.redirect(new URL("/login", request.url))
        : NextResponse.next()

      response.cookies.delete("auth-token")
      return response
    }
  } else {
    // Sem token
    if (isProtected) {
      console.log("🔒 Rota protegida sem token — redirecionando para /login")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Rota pública — libera acesso
    return NextResponse.next()
  }
}

// Aplica o middleware a todas as rotas, exceto arquivos estáticos e API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
