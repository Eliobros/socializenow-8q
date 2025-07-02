import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

// Função para seguir usuário (POST)
async function followUser(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
    }
    if (userId === user.userId) {
      return NextResponse.json({ error: "Você não pode seguir a si mesmo" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const follows = db.collection("follows")
    const users = db.collection("users")
    const notifications = db.collection("notifications")

    const existingFollow = await follows.findOne({
      followerId: new ObjectId(user.userId),
      followingId: new ObjectId(userId),
    })

    if (existingFollow) {
      return NextResponse.json({ error: "Você já segue este usuário" }, { status: 400 })
    }

    await follows.insertOne({
      followerId: new ObjectId(user.userId),
      followingId: new ObjectId(userId),
      createdAt: new Date(),
    })

    await users.updateOne({ _id: new ObjectId(userId) }, { $inc: { followers: 1 } })
    await users.updateOne({ _id: new ObjectId(user.userId) }, { $inc: { following: 1 } })

    await notifications.insertOne({
      userId: new ObjectId(userId),
      fromUserId: new ObjectId(user.userId),
      type: "follow",
      message: `${user.name} começou a seguir você`,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "Usuário seguido com sucesso" })
  } catch (error) {
    console.error("Follow user error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Função para deixar de seguir (DELETE)
async function unfollowUser(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const follows = db.collection("follows")
    const users = db.collection("users")

    const result = await follows.deleteOne({
      followerId: new ObjectId(user.userId),
      followingId: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Você não segue este usuário" }, { status: 400 })
    }

    await users.updateOne({ _id: new ObjectId(userId) }, { $inc: { followers: -1 } })
    await users.updateOne({ _id: new ObjectId(user.userId) }, { $inc: { following: -1 } })

    return NextResponse.json({ message: "Deixou de seguir o usuário" })
  } catch (error) {
    console.error("Unfollow user error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exporta usando withAuth para proteger as rotas
export const POST = withAuth(followUser)
export const DELETE = withAuth(unfollowUser)