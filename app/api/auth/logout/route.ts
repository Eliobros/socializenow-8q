import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ message: "Logout successful" }, { status: 200 })

  // Remover o cookie de autenticação
  response.cookies.set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expira imediatamente
    path: "/",
  })

  return response
}
