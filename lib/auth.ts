import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret"

export function getAuthUser(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch {
    return null
  }
}
