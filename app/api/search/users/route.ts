import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

async function searchUsers(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim() || ""

    const client = await clientPromise
    const db = client.db("socializenow")
    const users = db.collection("users")
    const follows = db.collection("follows")

    const searchQuery: any = {
      _id: { $ne: new ObjectId(user.userId) },
    }

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ]
    }

    const usersList = await users
      .find(searchQuery, {
        projection: { password: 0 },
      })
      .limit(20)
      .toArray()

    const usersWithFollowStatus = await Promise.all(
      usersList.map(async (foundUser) => {
        const isFollowing = await follows.findOne({
          followerId: new ObjectId(user.userId),
          followingId: foundUser._id,
        })

        return {
          ...foundUser,
          username: foundUser.username || "",
          bio: foundUser.bio || "",
          avatar: foundUser.avatar || "",
          followers: foundUser.followers ?? 0,
          following: foundUser.following ?? 0,
          isFollowing: !!isFollowing,
        }
      }),
    )

    return NextResponse.json({ users: usersWithFollowStatus })
  } catch (error) {
    console.error("Search users error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const GET = withAuth(searchUsers)