import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email e código são obrigatórios" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")

    // Buscar usuário
    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ error: "Email já verificado" }, { status: 400 })
    }

    // Verificar se o código expirou
    if (new Date() > user.codeExpires) {
      return NextResponse.json({ error: "Código expirado. Solicite um novo código." }, { status: 400 })
    }

    // Verificar código
    if (user.verificationCode !== code) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 })
    }

    // Ativar conta
    await users.updateOne(
      { email },
      {
        $set: {
          isEmailVerified: true,
        },
        $unset: {
          verificationCode: "",
          codeExpires: "",
        },
      },
    )

    return NextResponse.json({
      message: "Email verificado com sucesso!",
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
