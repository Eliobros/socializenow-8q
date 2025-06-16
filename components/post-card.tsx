"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface Post {
  _id: string
  content: string
  author: {
    name: string
    email: string
    _id: string
    avatar?: string
  }
  createdAt: string
  likes: number
  likedByUser: boolean  // Novo campo vindo do backend
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByUser)
  const [likeCount, setLikeCount] = useState(post.likes || 0)
  const [isLiking, setIsLiking] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleLike = async () => {
    if (isLiking || liked) return // Impede curtir várias vezes

    setIsLiking(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likes)
      }
    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {post.author.avatar ? (
              <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
            ) : null}
            <AvatarFallback className="bg-blue-600 text-white">{getInitials(post.author.name)}</AvatarFallback>
          </Avatar>
          <div>
            <Link href={`/profile/${post.author._id}`} className="font-semibold hover:text-blue-600 transition-colors">
              {post.author.name}
            </Link>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${liked ? "text-red-600" : "text-gray-600 hover:text-red-600"}`}
            onClick={handleLike}
            disabled={isLiking || liked} // Desativa botão se já curtiu
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {likeCount}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-blue-600">
            <MessageCircle className="h-4 w-4" />
            Comentar
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-green-600">
            <Share className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
