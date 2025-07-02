import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function getComments(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { postId } = params
    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "ID do post inválido" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const commentsCollection = db.collection("comments")

    const comments = await commentsCollection
      .aggregate([
        { $match: { postId: new ObjectId(postId) } },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
        {
          $project: {
            content: 1,
            createdAt: 1,
            "author._id": 1,
            "author.name": 1,
            "author.avatar": 1,
          },
        },
        { $sort: { createdAt: 1 } },
      ])
      .toArray()

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Erro ao buscar comentários:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function addComment(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { postId } = params
    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "ID do post inválido" }, { status: 400 })
    }

    const { content } = await request.json()
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Conteúdo do comentário é obrigatório" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const comments = db.collection("comments")
    const posts = db.collection("posts")
    const notifications = db.collection("notifications")
    const users = db.collection("users")

    const post = await posts.findOne({ _id: new ObjectId(postId) })
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    const currentUser = await users.findOne({ _id: new ObjectId(user.userId) })
    if (!currentUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const comment = {
      postId: new ObjectId(postId),
      authorId: new ObjectId(user.userId),
      content: content.trim(),
      createdAt: new Date(),
    }

    const result = await comments.insertOne(comment)

    await posts.updateOne({ _id: new ObjectId(postId) }, { $inc: { commentsCount: 1 } })

    if (post.authorId.toString() !== user.userId) {
      await notifications.insertOne({
        userId: post.authorId,
        fromUserId: new ObjectId(user.userId),
        type: "comment",
        message: `${currentUser.name} comentou no seu post`,
        postId: new ObjectId(postId),
        read: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      message: "Comentário adicionado com sucesso",
      commentId: result.insertedId,
    })
  } catch (error) {
    console.error("Add comment error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const GET = withAuth(getComments)
export const POST = withAuth(addComment)