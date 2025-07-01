import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

export async function GET(req: NextRequest) {
  try {
    // Pegar o token do cookie
    const token = req.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    return NextResponse.json(
      {
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          avatar: decoded.avatar,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 })
  }
}
