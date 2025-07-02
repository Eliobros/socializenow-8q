import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import cloudinary from "@/lib/cloudinary"

// Função auxiliar pra upload da imagem no Cloudinary
async function uploadImage(image: File) {
  try {
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "message_images",
            transformation: [
              { width: 800, height: 600, crop: "limit" },
              { quality: "auto" },
              { format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })
  } catch (error) {
    console.error("Erro ao converter imagem:", error)
    throw new Error("Erro ao processar imagem")
  }
}

// POST - Enviar nova mensagem
async function sendMessage(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    const contentType = request.headers.get("content-type")

    let conversationId: string
    let content: string
    let imageUrl: string | null = null

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData()
      conversationId = formData.get("conversationId") as string
      content = (formData.get("content") as string) || ""
      const image = formData.get("image") as File

      if (!conversationId) {
        return NextResponse.json({ error: "ID da conversa é obrigatório" }, { status: 400 })
      }

      if (!content.trim() && !image) {
        return NextResponse.json({ error: "Conteúdo ou imagem são obrigatórios" }, { status: 400 })
      }

      if (image) {
        try {
          const uploadResult = await uploadImage(image)
          imageUrl = (uploadResult as any).secure_url
        } catch (error) {
          console.error("Erro no upload da imagem:", error)
          return NextResponse.json({ error: "Erro ao fazer upload da imagem" }, { status: 500 })
        }
      }
    } else {
      const body = await request.json()
      conversationId = body.conversationId
      content = body.content

      if (!conversationId || !content) {
        return NextResponse.json({ error: "ID da conversa e conteúdo são obrigatórios" }, { status: 400 })
      }
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const messages = db.collection("messages")
    const conversations = db.collection("conversations")

    const conversation = await conversations.findOne({
      _id: new ObjectId(conversationId),
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
    }

    const receiverId = conversation.participants.find(
      (p: ObjectId) => !p.equals(new ObjectId(user.userId))
    )

    const messageData: any = {
      conversationId: new ObjectId(conversationId),
      sender: new ObjectId(user.userId),
      receiver: receiverId,
      content: content.trim(),
      read: false,
      createdAt: new Date(),
    }

    if (imageUrl) {
      messageData.image = imageUrl
    }

    const result = await messages.insertOne(messageData)

    const lastMessageContent = imageUrl ? content.trim() || "📷 Imagem" : content.trim()

    await conversations.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: {
            content: lastMessageContent,
            sender: new ObjectId(user.userId),
            createdAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      message: "Mensagem enviada com sucesso",
      messageId: result.insertedId,
      data: {
        ...messageData,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exportação protegida com withAuth
export const POST = withAuth(sendMessage)
