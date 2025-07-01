import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { compare } from "bcrypt"
import type { User } from "@/types/user"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const users = db.collection<User>("users")

    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 })
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 })
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
      { expiresIn: "7d" },
    )

    // Serializar o cookie
    const cookie = serialize("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    // Criar resposta com cabeçalho Set-Cookie
    const response = new NextResponse(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: profileInfo?.avatar,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      }
    )

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 })
  }
}
