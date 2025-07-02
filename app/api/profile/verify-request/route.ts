import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import clientPromise from "@/lib/mongodb"

async function createVerifyRequest(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
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

    // Validar arquivos
    if (
      !documentFront.type.startsWith("image/") ||
      !documentBack.type.startsWith("image/")
    ) {
      return NextResponse.json(
        { error: "Apenas arquivos de imagem são permitidos" },
        { status: 400 }
      )
    }

    if (documentFront.size > 5 * 1024 * 1024 || documentBack.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "As imagens devem ter no máximo 5MB" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const verifyRequests = db.collection("verifyRequests")
    const notifications = db.collection("notifications")

    // Verificar se já existe uma solicitação pendente
    const existingRequest = await verifyRequests.findOne({
      userId: new ObjectId(user.userId),
      status: "pending",
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "Você já possui uma solicitação pendente" },
        { status: 400 }
      )
    }

    // Salvar arquivos
    const timestamp = Date.now()
    const frontExtension = documentFront.name.split(".").pop()
    const backExtension = documentBack.name.split(".").pop()
    const frontFilename = `${user.userId}_front_${timestamp}.${frontExtension}`
    const backFilename = `${user.userId}_back_${timestamp}.${backExtension}`

    const uploadDir = join(process.cwd(), "public", "documents")
    await mkdir(uploadDir, { recursive: true })

    const frontBytes = await documentFront.arrayBuffer()
    const backBytes = await documentBack.arrayBuffer()
    const frontBuffer = Buffer.from(frontBytes)
    const backBuffer = Buffer.from(backBytes)

    await writeFile(join(uploadDir, frontFilename), frontBuffer)
    await writeFile(join(uploadDir, backFilename), backBuffer)

    // Criar solicitação
    await verifyRequests.insertOne({
      userId: new ObjectId(user.userId),
      fullName,
      birthDate: new Date(birthDate),
      reason,
      documentFront: `/documents/${frontFilename}`,
      documentBack: `/documents/${backFilename}`,
      status: "pending",
      createdAt: new Date(),
    })

    // Criar notificação para o usuário
    await notifications.insertOne({
      userId: new ObjectId(user.userId),
      type: "verification_request",
      message:
        "O seu pedido de solicitação de selo foi enviado para a Equipe da SocializeNow. Você receberá uma notificação quando for aprovada ou se precisarem de mais informações.",
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "Solicitação enviada com sucesso" })
  } catch (error) {
    console.error("Verify request error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const POST = withAuth(createVerifyRequest)