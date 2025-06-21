import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import cloudinary from "@/lib/cloudinary"

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

async function uploadToCloudinary(file: File, filename: string) {
  const buffer = Buffer.from(await file.arrayBuffer())

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        public_id: `documents/${filename}`,
        folder: "socializenow/verify_docs", // opcional: organiza em pasta
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )

    stream.end(buffer)
  })
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const formData = await request.formData()
    const fullName = formData.get("fullName") as string
    const birthDate = formData.get("birthDate") as string
    const reason = formData.get("reason") as string
    const documentFront = formData.get("documentFront") as File
    const documentBack = formData.get("documentBack") as File

    if (!fullName || !birthDate || !reason || !documentFront || !documentBack) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (!documentFront.type.startsWith("image/") || !documentBack.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas arquivos de imagem são permitidos" }, { status: 400 })
    }

    if (documentFront.size > 5 * 1024 * 1024 || documentBack.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "As imagens devem ter no máximo 5MB" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const verifyRequests = db.collection("verifyRequests")
    const notifications = db.collection("notifications")

    const existingRequest = await verifyRequests.findOne({
      userId: new ObjectId(user.userId),
      status: "pending",
    })

    if (existingRequest) {
      return NextResponse.json({ error: "Você já possui uma solicitação pendente" }, { status: 400 })
    }

    const timestamp = Date.now()
    const frontExt = documentFront.name.split(".").pop()
    const backExt = documentBack.name.split(".").pop()

    const frontFilename = `${user.userId}_front_${timestamp}.${frontExt}`
    const backFilename = `${user.userId}_back_${timestamp}.${backExt}`

    // Upload para Cloudinary
    const frontResult: any = await uploadToCloudinary(documentFront, frontFilename)
    const backResult: any = await uploadToCloudinary(documentBack, backFilename)

    await verifyRequests.insertOne({
      userId: new ObjectId(user.userId),
      fullName,
      birthDate: new Date(birthDate),
      reason,
      documentFront: frontResult.secure_url,
      documentBack: backResult.secure_url,
      status: "pending",
      createdAt: new Date(),
    })

    await notifications.insertOne({
      userId: new ObjectId(user.userId),
      type: "verification_request",
      message:
        "O seu pedido de solicitação de selo foi enviado para a Equipe da SocializeNow. Você receberá uma notificação quando for aprovada ou se for recusada.",
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "Solicitação enviada com sucesso" })
  } catch (error) {
    console.error("Verify request error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
