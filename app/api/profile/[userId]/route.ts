import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function testUserPosts(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { userId } = params

    console.log("Usuário autenticado (token):", user.userId)
    console.log("Usuário alvo (param):", userId)

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "ID do usuário inválido" }, { status: 400 })
    }

    const targetUserId = new ObjectId(userId)
    const client = await clientPromise
    const db = client.db("socializenow")
    const posts = db.collection("posts")

    const postsList = await posts
      .find({ authorId: targetUserId })
      .project({ content: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray()

    console.log("Quantidade de posts encontrados:", postsList.length)

    return NextResponse.json({
      authenticatedUserId: user.userId,
      targetUserId: userId,
      postsCount: postsList.length,
      posts: postsList,
    })
  } catch (error) {
    console.error("Erro na rota temporária:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const GET = withAuth(testUserPosts)
