import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function getConversationMessages(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { conversationId } = params
    if (!conversationId) {
      return NextResponse.json({ error: "ID da conversa é obrigatório" }, { status: 400 })
    }

    if (!ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "ID da conversa inválido" }, { status: 400 })
    }

    const conversationObjectId = new ObjectId(conversationId)

    const client = await clientPromise
    const db = client.db("socializenow")
    const messages = db.collection("messages")

    const conversationMessages = await messages
      .aggregate([
        {
          $match: {
            conversationId: conversationObjectId,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "sender",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "receiver",
            foreignField: "_id",
            as: "receiver",
          },
        },
        { $unwind: "$sender" },
        { $unwind: "$receiver" },
        {
          $project: {
            content: 1,
            image: 1,
            read: 1,
            createdAt: 1,
            "sender._id": 1,
            "sender.name": 1,
            "sender.avatar": 1,
            "receiver._id": 1,
            "receiver.name": 1,
            "receiver.avatar": 1,
          },
        },
        {
          $sort: { createdAt: 1 },
        },
      ])
      .toArray()

    return NextResponse.json({ messages: conversationMessages })
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const GET = withAuth(getConversationMessages)
