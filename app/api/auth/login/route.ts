import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { compare } from "bcrypt"
import type { User } from "@/types/user"
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
    const users = db.collection<User>("users")

    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 400 })
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Credenciais inválidas" }, { status: 400 })
    }

    const profiles = db.collection("profiles")
    const profileInfo = await profiles.findOne({ userId: user._id })

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        avatar: profileInfo?.avatar,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    const response = NextResponse.json({
      message: "Login efetuado com sucesso",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: profileInfo?.avatar,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[LOGIN_ERROR]", error)
    return NextResponse.json({ message: "Erro interno no servidor" }, { status: 500 })
  }
}