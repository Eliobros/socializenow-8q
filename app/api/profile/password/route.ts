import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { withAuth, getAuthUser } from "@/lib/withAuth"

// Atualizar senha do usuário
async function updatePassword(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")

    const currentUser = await users.findOne({ _id: new ObjectId(user.userId) })
    if (!currentUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      currentUser.password
    )
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    await users.updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: { password: hashedNewPassword, updatedAt: new Date() } }
    )

    return NextResponse.json({ message: "Senha alterada com sucesso" })
  } catch (error) {
    console.error("Update password error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const PUT = withAuth(updatePassword)