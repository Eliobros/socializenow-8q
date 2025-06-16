import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const notificationId = params.id

    if (!ObjectId.isValid(notificationId)) {
      return NextResponse.json({ error: "ID de notificação inválido" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const notifications = db.collection("notifications")

    const result = await notifications.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true } }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Notificação não encontrada ou já marcada" }, { status: 404 })
    }

    return NextResponse.json({ message: "Notificação marcada como lida" })
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

