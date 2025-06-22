import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("socializenow");

    const users = db.collection("users");
    const posts = db.collection("posts");

    // Total de usuários e posts
    const totalUsers = await users.countDocuments();
    const totalPosts = await posts.countDocuments();

    // Usuários verificados (com selo)
    const verifiedUsersCount = await users.countDocuments({ isVerified: true });

    // Usuário mais seguido
    const mostFollowedUser = await users.find().sort({ followers: -1 }).limit(1).toArray();

    // Pipeline para posts mais curtidos (likes)
    const mostLikedPipeline = [
      {
        $addFields: {
          likesCount: {
            $cond: {
              if: { $isArray: "$likes" },
              then: { $size: "$likes" },
              else: {
                $cond: {
                  if: { $and: [{ $gte: ["$likes", 0] }, { $type: "$likes" }] },
                  then: "$likes",
                  else: 0,
                }
              }
            }
          },
        },
      },
      { $sort: { likesCount: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorData",
        },
      },
      { $unwind: { path: "$authorData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          content: 1,
          likesCount: 1,
          authorName: "$authorData.name",
        },
      },
    ];
    const mostLikedPostArray = await posts.aggregate(mostLikedPipeline).toArray();
    const mostLikedPost = mostLikedPostArray[0] || null;

    // Pipeline para posts mais comentados
    const mostCommentedPipeline = [
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "commentsData",
        },
      },
      {
        $addFields: {
          commentsCount: { $size: "$commentsData" },
          likesCount: {
            $cond: {
              if: { $isArray: "$likes" },
              then: { $size: "$likes" },
              else: {
                $cond: {
                  if: { $and: [{ $gte: ["$likes", 0] }, { $type: "$likes" }] },
                  then: "$likes",
                  else: 0,
                }
              }
            }
          },
          sharesCount: {
            $cond: {
              if: { $isArray: "$shares" },
              then: { $size: "$shares" },
              else: {
                $cond: {
                  if: { $and: [{ $gte: ["$shares", 0] }, { $type: "$shares" }] },
                  then: "$shares",
                  else: 0,
                }
              }
            }
          },
        },
      },
      { $sort: { commentsCount: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorData",
        },
      },
      { $unwind: { path: "$authorData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          content: 1,
          commentsCount: 1,
          authorName: "$authorData.name",
        },
      },
    ];
    const mostCommentedPostArray = await posts.aggregate(mostCommentedPipeline).toArray();
    const mostCommentedPost = mostCommentedPostArray[0] || null;

    // Pipeline para posts mais compartilhados (shares)
    const mostSharedPipeline = [
      {
        $addFields: {
          sharesCount: {
            $cond: {
              if: { $isArray: "$shares" },
              then: { $size: "$shares" },
              else: {
                $cond: {
                  if: { $and: [{ $gte: ["$shares", 0] }, { $type: "$shares" }] },
                  then: "$shares",
                  else: 0,
                }
              }
            }
          },
        },
      },
      { $sort: { sharesCount: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorData",
        },
      },
      { $unwind: { path: "$authorData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          content: 1,
          sharesCount: 1,
          authorName: "$authorData.name",
        },
      },
    ];
    const mostSharedPostArray = await posts.aggregate(mostSharedPipeline).toArray();
    const mostSharedPost = mostSharedPostArray[0] || null;

    return NextResponse.json({
      totalUsers,
      totalPosts,
      verifiedUsersCount,   // Número de usuários com selo
      mostFollowedUser: mostFollowedUser[0] || null,
      mostLikedPost,
      mostCommentedPost,
      mostSharedPost,
    });
  } catch (err) {
    console.error("Erro no dashboard:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
