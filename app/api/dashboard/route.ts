// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("socializenow")

    const users = db.collection("users")
    const posts = db.collection("posts")

    const [totalUsers, totalPosts] = await Promise.all([
      users.countDocuments(),
      posts.countDocuments()
    ])

    const [mostFollowedUser] = await users
      .find({}, { projection: { name: 1, followers: 1 } })
      .sort({ followers: -1 })
      .limit(1)
      .toArray()

    const [mostLikedPost] = await posts
      .find({}, { projection: { content: 1, likes: 1 } })
      .sort({ likes: -1 })
      .limit(1)
      .toArray()

    const [mostCommentedPost] = await posts
      .find({}, { projection: { content: 1, commentsCount: 1 } })
      .sort({ commentsCount: -1 })
      .limit(1)
      .toArray()

    const [mostSharedPost] = await posts
      .find({}, { projection: { content: 1, shares: 1 } })
      .sort({ shares: -1 })
      .limit(1)
      .toArray()

    return NextResponse.json({
      totalUsers,
      totalPosts,
      mostFollowedUser: mostFollowedUser || null,
      mostLikedPost: mostLikedPost || null,
      mostCommentedPost: mostCommentedPost || null,
      mostSharedPost: mostSharedPost || null,
    })
  } catch (err) {
    console.error("Erro no dashboard:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

