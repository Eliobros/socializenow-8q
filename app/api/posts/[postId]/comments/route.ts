import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params

    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
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

    const post = await posts.findOne({ _id: new ObjectId(postId) })
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    const comment = {
      postId: new ObjectId(postId),
      authorId: new ObjectId(user.userId),
      content: content.trim(),
      createdAt: new Date(),
    }

    const result = await comments.insertOne(comment)

    if (post.authorId.toString() !== user.userId) {
      await notifications.insertOne({
        userId: post.authorId,
        type: "comment",
        message: `${user.name} comentou no seu post`,
        from: {
          _id: new ObjectId(user.userId),
          name: user.name,
          username: user.username || "",
          avatar: user.avatar || "",
        },
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
    console.error("Erro ao adicionar comentário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
