import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function getUserPosts(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { userId } = params
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "ID do usuário inválido" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const posts = db.collection("posts")

    const targetUserId = new ObjectId(userId)

    const postsList = await posts
      .aggregate([
        { $match: { authorId: targetUserId } },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "authorId",
            foreignField: "userId",
            as: "profile",
          },
        },
        { $unwind: "$author" },
        {
          $project: {
            content: 1,
            createdAt: 1,
            likes: 1,
            "author._id": 1,
            "author.name": 1,
            "author.avatar": { $arrayElemAt: ["$profile.avatar", 0] },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    return NextResponse.json({ posts: postsList })
  } catch (error) {
    console.error("Get user posts error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const GET = withAuth(getUserPosts)