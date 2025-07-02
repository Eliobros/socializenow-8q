import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function getUnreadMessages(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const messages = db.collection("messages")

    const count = await messages.countDocuments({
      receiverId: new ObjectId(user.userId),
      read: false,
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Erro ao contar mensagens não lidas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exporta com proteção de autenticação
export const GET = withAuth(getUnreadMessages)