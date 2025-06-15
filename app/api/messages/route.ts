import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
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

    const { conversationId, content } = await request.json()

    if (!conversationId || !content) {
      return NextResponse.json({ error: "ID da conversa e conteúdo são obrigatórios" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const messages = db.collection("messages")
    const conversations = db.collection("conversations")

    // Get conversation to find receiver
    const conversation = await conversations.findOne({ _id: new ObjectId(conversationId) })
    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
    }

    // Find receiver (the other participant)
    const receiverId = conversation.participants.find((p: ObjectId) => !p.equals(new ObjectId(user.userId)))

    // Create message
    const result = await messages.insertOne({
      conversationId: new ObjectId(conversationId),
      sender: new ObjectId(user.userId),
      receiver: receiverId,
      content: content.trim(),
      read: false,
      createdAt: new Date(),
    })

    // Update conversation's last message
    await conversations.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: {
            content: content.trim(),
            sender: new ObjectId(user.userId),
            createdAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      message: "Mensagem enviada com sucesso",
      messageId: result.insertedId,
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
