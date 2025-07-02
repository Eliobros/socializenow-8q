import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch {
    return null
  }
}

export function withAuth(handler: (req: NextRequest) => Promise<any>) {
  return async function wrappedHandler(req: NextRequest) {
    const user = getAuthUser(req)

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    return await handler(req)
  }
}
