import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Função para gerar código de 6 dígitos
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, username, password } = await request.json()

    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")

    // Verificar se já existe usuário com o mesmo e-mail ou username
    const existingUser = await users.findOne({ $or: [{ email }, { username }] })

    if (existingUser) {
      return NextResponse.json({ error: "Email ou nome de usuário já está em uso" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verificationCode = generateVerificationCode()
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Criar usuário não verificado
    const result = await users.insertOne({
      name,
      email,
      username,
      password: hashedPassword,
      isEmailVerified: false,
      verificationCode,
      codeExpires,
      createdAt: new Date(),
    })

    // Enviar email de verificação
    try {
      await resend.emails.send({
        from: "eliobrostech3@gmail.com", // Substitua pelo seu domínio
        to: email,
        subject: "Código de Verificação - SocializeNow",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bem-vindo ao SocializeNow!</h2>
            <p>Olá <strong>${name}</strong>,</p>
            <p>Use o código abaixo para verificar seu email:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
            </div>
            <p>Este código expira em 10 minutos.</p>
            <p>Se você não criou esta conta, ignore este email.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">SocializeNow - Conectando pessoas</p>
          </div>
        `,
      })

      return NextResponse.json({
        message: "Usuário criado! Verifique seu email para ativar a conta.",
        userId: result.insertedId,
      })
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError)

      // Remover usuário se falhou ao enviar email
      await users.deleteOne({ _id: result.insertedId })

      return NextResponse.json({ error: "Erro ao enviar email de verificação. Tente novamente." }, { status: 500 })
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
