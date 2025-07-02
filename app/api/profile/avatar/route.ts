import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import cloudinary from "@/lib/cloudinary"

// POST - Upload e atualização de avatar do usuário
async function uploadAvatar(request: NextRequest) {
  try {
    const user = getAuthUser(request)

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas arquivos de imagem são permitidos" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "A imagem deve ter no máximo 5MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataURI = `data:${file.type};base64,${base64}`

    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "avatars",
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      public_id: user.userId,
    })

    const avatarUrl = uploadResult.secure_url

    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")

    await users.updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: { avatar: avatarUrl, updatedAt: new Date() } }
    )

    return NextResponse.json({ message: "Avatar atualizado com sucesso", avatarUrl })
  } catch (error) {
    console.error("Erro ao fazer upload do avatar:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const POST = withAuth(uploadAvatar)