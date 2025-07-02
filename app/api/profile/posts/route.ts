import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function getUserPosts(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const posts = db.collection("posts")

    const userPosts = await posts
      .aggregate([
        {
          $match: { authorId: new ObjectId(user.userId) },
        },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $project: {
            content: 1,
            createdAt: 1,
            likes: 1,
            image: 1,
            "author.name": 1,
            "author.email": 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray()

    return NextResponse.json({ posts: userPosts })
  } catch (error) {
    console.error("Get user posts error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const GET = withAuth(getUserPosts)