import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import clientPromise from "@/lib/mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas arquivos de imagem são permitidos" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "A imagem deve ter no máximo 5MB" }, { status: 400 })
    }

    // Create unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${user.userId}_${timestamp}.${extension}`

    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public", "image_profiles")
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Update user avatar in database
    const avatarUrl = `/image_profiles/${filename}`
    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")

    await users.updateOne({ _id: new ObjectId(user.userId) }, { $set: { avatar: avatarUrl, updatedAt: new Date() } })

    return NextResponse.json({
      message: "Avatar atualizado com sucesso",
      avatarUrl,
    })
  } catch (error) {
    console.error("Upload avatar error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
