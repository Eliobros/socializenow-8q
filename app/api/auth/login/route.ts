import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { compare } from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Senha incorreta" }, { status: 401 })
    }

    // Garanta que o ID seja string
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    const response = NextResponse.json({
      success: true,
      message: "Login bem-sucedido",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    })

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Apenas HTTPS em produção
      sameSite: "strict", // Mais seguro
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })

    return response
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ message: "Algo deu errado!" }, { status: 500 })
  }
}
