import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

// GET - Buscar quantidade de notificações não lidas
async function getUnreadNotifications(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    const client = await clientPromise
    const db = client.db("socializenow")
    const notifications = db.collection("notifications")

    const count = await notifications.countDocuments({
      userId: new ObjectId(user.userId),
      read: false,
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Erro ao buscar notificações não lidas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exportação protegida com withAuth
export const GET = withAuth(getUnreadNotifications)
