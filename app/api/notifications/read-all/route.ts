import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function markNotificationsAsRead(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const notifications = db.collection("notifications")

    await notifications.updateMany(
      {
        userId: new ObjectId(user.userId),
        read: false,
      },
      {
        $set: { read: true },
      }
    )

    return NextResponse.json({ message: "Todas as notificações foram marcadas como lidas" })
  } catch (error) {
    console.error("Erro ao marcar notificações como lidas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exporta no padrão com autenticação
export const PUT = withAuth(markNotificationsAsRead)