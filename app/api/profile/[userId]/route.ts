import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function getUserProfile(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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
    const users = db.collection("users")
    const profiles = db.collection("profiles")
    const follows = db.collection("follows")
    const posts = db.collection("posts")

    const targetUserId = new ObjectId(userId)
    const currentUserId = new ObjectId(user.userId)

    // Get user basic info
    const targetUser = await users.findOne({ _id: targetUserId })
    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Get profile info
    const profileInfo = await profiles.findOne({ userId: targetUserId })

    // Count followers and following
    const followersCount = await follows.countDocuments({ followingId: targetUserId })
    const followingCount = await follows.countDocuments({ followerId: targetUserId })

    // Count posts
    const postsCount = await posts.countDocuments({ authorId: targetUserId })

    // Check if current user is following this user
    const isFollowing = await follows.findOne({
      followerId: currentUserId,
      followingId: targetUserId,
    })

    const profile = {
      _id: targetUser._id,
      name: targetUser.name,
      username: profileInfo?.username || targetUser.email.split("@")[0],
      email: targetUser.email,
      bio: profileInfo?.bio || "",
      avatar: profileInfo?.avatar,
      followers: followersCount,
      following: followingCount,
      postsCount: postsCount,
      isFollowing: !!isFollowing,
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Get user profile error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const GET = withAuth(getUserProfile)