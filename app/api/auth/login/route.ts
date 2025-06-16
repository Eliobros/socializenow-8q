import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compare } from "bcrypt"
import type { User } from "@/types/user"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 })
    }

    const users = db.collection<User>("users")
    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 })
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 })
    }

    // Após verificar a senha, buscar informações do perfil
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

    // const token = await new SignJWT({
    //   userId: user._id,
    //   email: user.email,
    //   name: user.name,
    // })
    //   .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    //   .setIssuedAt()
    //   .setExpirationTime(JWT_EXPIRES)
    //   .sign(getJwtSecretKey());

    // setUserSession(token);

    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 })
  }
}
