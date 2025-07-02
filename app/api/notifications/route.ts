import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

// GET - Buscar notificações do usuário
async function getNotifications(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    const client = await clientPromise
    const db = client.db("socializenow")
    const notifications = db.collection("notifications")

    // Buscar notificações do usuário com informações do remetente
    const userNotifications = await notifications
      .aggregate([
        { $match: { userId: new ObjectId(user.userId) } },
        {
          $lookup: {
            from: "users",
            localField: "fromUserId",
            foreignField: "_id",
            as: "from",
          },
        },
        {
          $addFields: {
            from: {
              $cond: {
                if: { $gt: [{ $size: "$from" }, 0] },
                then: { $arrayElemAt: ["$from", 0] },
                else: {
                  name: "SocializeNow",
                  username: "system",
                  avatar: "",
                },
              },
            },
          },
        },
        {
          $project: {
            type: 1,
            message: 1,
            read: 1,
            createdAt: 1,
            postId: 1,
            "from.name": 1,
            "from.username": 1,
            "from.avatar": 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 50 },
      ])
      .toArray()

    return NextResponse.json({ notifications: userNotifications })
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exportação protegida com withAuth
export const GET = withAuth(getNotifications)
