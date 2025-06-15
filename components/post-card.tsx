import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share } from "lucide-react"

interface Post {
  _id: string
  content: string
  author: {
    name: string
    email: string
  }
  createdAt: string
  likes: number
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white">{getInitials(post.author.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.author.name}</p>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
        <div className="flex items-center gap-4 pt-2 border-t">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-red-600">
            <Heart className="h-4 w-4" />
            {post.likes || 0}
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
