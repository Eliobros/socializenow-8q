import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function toggleLike(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { postId } = params
    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "ID do post inválido" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const posts = db.collection("posts")
    const likes = db.collection("likes")
    const users = db.collection("users")
    const notifications = db.collection("notifications")

    const userId = new ObjectId(user.userId)
    const postObjectId = new ObjectId(postId)

    // Verifica se o post existe
    const post = await posts.findOne({ _id: postObjectId })
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    // Verifica se o usuário já curtiu
    const existingLike = await likes.findOne({
      userId,
      postId: postObjectId,
    })

    let liked = false

    if (existingLike) {
      // Descurtir
      await likes.deleteOne({ _id: existingLike._id })
      await posts.updateOne({ _id: postObjectId }, { $inc: { likes: -1 } })
    } else {
      // Curtir
      await likes.insertOne({
        userId,
        postId: postObjectId,
        createdAt: new Date(),
      })
      await posts.updateOne({ _id: postObjectId }, { $inc: { likes: 1 } })
      liked = true

      // Busca o nome do usuário para notificação
      const currentUser = await users.findOne({ _id: userId })
      if (post.authorId.toString() !== user.userId && currentUser) {
        await notifications.insertOne({
          userId: post.authorId,
          fromUserId: userId,
          type: "like",
          message: `${currentUser.name} curtiu seu post`,
          read: false,
          createdAt: new Date(),
        })
      }
    }

    // Atualiza a contagem de likes
    const updatedPost = await posts.findOne({ _id: postObjectId })
    const likeCount = updatedPost?.likes || 0

    return NextResponse.json({ liked, likes: likeCount })
  } catch (error) {
    console.error("Like post error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const POST = withAuth(toggleLike)