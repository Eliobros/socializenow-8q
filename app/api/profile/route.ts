import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

// GET - Buscar perfil do usuário logado
async function getProfile(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")
    const posts = db.collection("posts")

    // Buscar perfil do usuário
    const userProfile = await users.findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { password: 0 } }
    )

    if (!userProfile) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Contar posts do usuário
    const postsCount = await posts.countDocuments({ authorId: new ObjectId(user.userId) })

    const profile = {
      ...userProfile,
      username: userProfile.username || "",
      bio: userProfile.bio || "",
      avatar: userProfile.avatar || "",
      followers: userProfile.followers || 0,
      following: userProfile.following || 0,
      isVerified: userProfile.isVerified || false,
      postsCount,
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Erro ao buscar perfil:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar perfil do usuário
async function updateProfile(request: NextRequest) {
  try {
    const user = getAuthUser(request)

    const { name, username, bio, avatar } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")

    // Verificar se o nome de usuário já está em uso
    if (username) {
      const existingUser = await users.findOne({
        username,
        _id: { $ne: new ObjectId(user.userId) },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Nome de usuário já está em uso" }, { status: 400 })
      }
    }

    const updateData: any = {
      name,
      bio: bio || "",
      avatar: avatar || "",
      updatedAt: new Date(),
    }

    if (username) {
      updateData.username = username
    }

    await users.updateOne({ _id: new ObjectId(user.userId) }, { $set: updateData })

    return NextResponse.json({ message: "Perfil atualizado com sucesso" })
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exportações protegidas com withAuth
export const GET = withAuth(getProfile)
export const PUT = withAuth(updateProfile)
