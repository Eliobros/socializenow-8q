import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")

    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ error: "Email já verificado" }, { status: 400 })
    }

    const verificationCode = generateVerificationCode()
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Atualizar código
    await users.updateOne(
      { email },
      {
        $set: {
          verificationCode,
          codeExpires,
        },
      },
    )

    // Reenviar email
    await resend.emails.send({
      from: "SocializeNow <noreply@seudominio.com>",
      to: email,
      subject: "Novo Código de Verificação - SocializeNow",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Novo Código de Verificação</h2>
          <p>Olá <strong>${user.name}</strong>,</p>
          <p>Aqui está seu novo código de verificação:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
          </div>
          <p>Este código expira em 10 minutos.</p>
        </div>
      `,
    })

    return NextResponse.json({
      message: "Novo código enviado!",
    })
  } catch (error) {
    console.error("Resend code error:", error)
    return NextResponse.json({ error: "Erro ao reenviar código" }, { status: 500 })
  }
}
