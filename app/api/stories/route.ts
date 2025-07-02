import { type NextRequest, NextResponse } from "next/server"
import { withAuth, getAuthUser } from "@/lib/withAuth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import cloudinary from "@/lib/cloudinary"

// GET - Buscar stories dos usuários seguidos
async function getStories(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    const client = await clientPromise
    const db = client.db("socializenow")
    const stories = db.collection("stories")
    const follows = db.collection("follows")
    const users = db.collection("users")

    // Buscar usuários que o usuário atual segue
    const following = await follows
      .find({
        follower: new ObjectId(user.userId),
      })
      .toArray()

    const followingIds = following.map((f) => f.following)
    followingIds.push(new ObjectId(user.userId)) // Incluir próprios stories

    // Buscar stories das últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const userStories = await stories
      .aggregate([
        {
          $match: {
            author: { $in: followingIds },
            createdAt: { $gte: twentyFourHoursAgo },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorData",
          },
        },
        {
          $unwind: "$authorData",
        },
        {
          $group: {
            _id: "$author",
            stories: {
              $push: {
                _id: "$_id",
                image: "$image",
                content: "$content",
                createdAt: "$createdAt",
                views: "$views",
                likes: "$likes",
                viewedByUser: {
                  $in: [new ObjectId(user.userId), "$views"],
                },
                likedByUser: {
                  $in: [new ObjectId(user.userId), "$likes"],
                },
              },
            },
            author: { $first: "$authorData" },
            hasUnviewed: {
              $sum: {
                $cond: [{ $not: { $in: [new ObjectId(user.userId), "$views"] } }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { hasUnviewed: -1, "stories.createdAt": -1 },
        },
      ])
      .toArray()

    return NextResponse.json({ stories: userStories })
  } catch (error) {
    console.error("Get stories error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar novo story
async function createStory(request: NextRequest) {
  try {
    const user = getAuthUser(request)

    const formData = await request.formData()
    const content = (formData.get("content") as string) || ""
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 })
    }

    let imageUrl: string

    try {
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadResponse = (await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "image",
              folder: "stories",
              transformation: [
                { width: 1080, height: 1920, crop: "limit" },
                { quality: "auto" },
                { format: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            },
          )
          .end(buffer)
      })) as any

      imageUrl = uploadResponse.secure_url
    } catch (error) {
      console.error("Erro no upload da imagem:", error)
      return NextResponse.json({ error: "Erro ao fazer upload da imagem" }, { status: 500 })
    }

    const client = await clientPromise
    const db = client.db("socializenow")
    const stories = db.collection("stories")

    const result = await stories.insertOne({
      author: new ObjectId(user.userId),
      content: content.trim(),
      image: imageUrl,
      views: [],
      likes: [],
      createdAt: new Date(),
    })

    return NextResponse.json({
      message: "Story criado com sucesso",
      storyId: result.insertedId,
    })
  } catch (error) {
    console.error("Create story error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Exportações protegidas com withAuth
export const GET = withAuth(getStories)
export const POST = withAuth(createStory)
