import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function createSupportTicket(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { subject, message } = await request.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Assunto e mensagem são obrigatórios" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const supportTickets = db.collection("supportTickets")
    const users = db.collection("users")

    const userData = await users.findOne({ _id: new ObjectId(user.userId) })
    if (!userData) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    await supportTickets.insertOne({
      userId: new ObjectId(user.userId),
      name: userData.name,
      username: userData.username || userData.email.split("@")[0],
      email: userData.email,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "Ticket criado com sucesso" })
  } catch (error) {
    console.error("Create support ticket error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const POST = withAuth(createSupportTicket)