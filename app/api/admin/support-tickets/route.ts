import { NextResponse, type NextRequest } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import clientPromise from "@/lib/mongodb"

async function getSupportTickets(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const supportTickets = db.collection("supportTickets")

    // Aqui, se quiser, pode filtrar tickets pelo usuário, ex: { userId: user.userId }
    // Mas se quiser todos os tickets, mantém find({})

    const tickets = await supportTickets.find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Get support tickets error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const GET = withAuth(getSupportTickets)