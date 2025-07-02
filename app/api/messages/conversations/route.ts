import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

// GET: Buscar conversas do usuário logado
async function getConversations(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const conversations = db.collection("conversations")

    const userConversations = await conversations
      .aggregate([
        {
          $match: {
            participants: new ObjectId(user.userId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participantDetails",
          },
        },
        {
          $addFields: {
            participants: "$participantDetails",
            unreadCount: 0, // (placeholder, pode ser calculado depois)
          },
        },
        {
          $project: {
            participants: {
              _id: 1,
              name: 1,
              avatar: 1,
            },
            lastMessage: 1,
            unreadCount: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
      ])
      .toArray()

    return NextResponse.json({ conversations: userConversations })
  } catch (error) {
    console.error("Erro ao buscar conversas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST: Criar nova conversa (ou retornar se já existir)
async function createConversation(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const conversations = db.collection("conversations")

    const existingConversation = await conversations.findOne({
      participants: {
        $all: [new ObjectId(user.userId), new ObjectId(userId)],
        $size: 2,
      },
    })

    if (existingConversation) {
      return NextResponse.json({ conversationId: existingConversation._id })
    }

    const result = await conversations.insertOne({
      participants: [new ObjectId(user.userId), new ObjectId(userId)],
      lastMessage: {
        content: "",
        sender: new ObjectId(user.userId),
        createdAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ conversationId: result.insertedId })
  } catch (error) {
    console.error("Erro ao criar conversa:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exporta as rotas com proteção
export const GET = withAuth(getConversations)
export const POST = withAuth(createConversation)