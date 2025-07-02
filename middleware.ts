import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

const protectedRoutes = ["/feed", "/profile", "/settings", "/messages", "/notifications", "/search"]
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value

  console.log("🛡️ Middleware para:", pathname)
  console.log("🔑 Token recebido:", token)

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuth = authRoutes.some((route) => pathname.startsWith(route))

  if (token) {
    try {
      jwt.verify(token, JWT_SECRET)
      console.log("✅ Token válido")

      if (isAuth) {
        // Usuário logado não deve acessar login/register
        console.log("🔄 Usuário logado tenta acessar auth route, redirecionando para /feed")
        return NextResponse.redirect(new URL("/feed", request.url))
      }

      // Token válido e rota permitida
      return NextResponse.next()
    } catch (e) {
      console.log("❌ Token inválido:", e)
      // Token inválido, delete cookie e redireciona se rota protegida
      const res = isProtected ? NextResponse.redirect(new URL("/login", request.url)) : NextResponse.next()
      res.cookies.delete("auth-token")
      return res
    }
  } else {
    // Sem token
    if (isProtected) {
      console.log("❌ Sem token em rota protegida, redirecionando para /login")
      return NextResponse.redirect(new URL("/login", request.url))
    }
    // Rota pública, libera acesso
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}