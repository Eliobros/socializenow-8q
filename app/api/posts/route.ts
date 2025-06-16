import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("socializenow");
    const posts = db.collection("posts");

    const userId = new ObjectId(user.userId);

    const postsList = await posts.aggregate([
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
        $lookup: {
          from: "likes",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $eq: ["$userId", userId] },
                  ],
                },
              },
            },
          ],
          as: "userLiked",
        },
      },
      {
        $addFields: {
          likedByUser: { $gt: [{ $size: "$userLiked" }, 0] },
        },
      },
      {
        $project: {
          content: 1,
          createdAt: 1,
          likes: 1,
          likedByUser: 1,
          "author._id": 1,
          "author.name": 1,
          "author.email": 1,
          "author.avatar": 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]).toArray();

    return NextResponse.json({ posts: postsList });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("socializenow");
    const posts = db.collection("posts");

    const newPost = {
      authorId: new ObjectId(user.userId),
      content,
      createdAt: new Date(),
      likes: 0,
    };

    const result = await posts.insertOne(newPost);

    return NextResponse.json({ message: "Post criado com sucesso", postId: result.insertedId });
  } catch (error) {
    console.error("Erro ao criar post:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

