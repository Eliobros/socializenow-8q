import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function createPayment(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const payments = db.collection("payments")

    const data = await req.json()

    if (!data.numero || !data.nome || !data.valor) {
      return NextResponse.json({ success: false, message: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const pagamento = await payments.insertOne({
      numero: data.numero,
      nome: data.nome,
      email: data.email || null,
      valor: Number.parseFloat(data.valor),
      meio_de_pagamento: data.meio_de_pagamento || "Mpesa",
      status: data.status || "pendente",
      tipo: "selo_verificacao",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(user.userId), // opcional, pra saber quem criou o pagamento
    })

    return NextResponse.json({
      success: true,
      pagamento: {
        id: pagamento.insertedId,
        ...data,
      },
    })
  } catch (err) {
    console.error("Erro ao gravar pagamento:", err)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

async function listPayments(req: NextRequest) {
  try {
    const user = getAuthUser(req)
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const payments = db.collection("payments")

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const tipo = searchParams.get("tipo")

    const filter: any = {}
    if (status) filter.status = status
    if (tipo) filter.tipo = tipo

    const pagamentos = await payments.find(filter).sort({ createdAt: -1 }).limit(50).toArray()

    return NextResponse.json({ success: true, pagamentos })
  } catch (err) {
    console.error("Erro ao buscar pagamentos:", err)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export const POST = withAuth(createPayment)
export const GET = withAuth(listPayments)