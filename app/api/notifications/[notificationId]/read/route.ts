import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function markNotificationRead(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const notifications = db.collection("notifications")

    // Marcar notificação como lida
    const result = await notifications.updateOne(
      {
        _id: new ObjectId(params.notificationId),
        userId: new ObjectId(user.userId),
      },
      {
        $set: { read: true },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notificação marcada como lida" })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const PUT = withAuth(markNotificationRead)