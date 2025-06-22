"use client"

import { useEffect, useState } from "react"

type DashboardData = {
  totalUsers: number
  totalPosts: number
  verifiedUsersCount: number
  mostFollowedUser: {
    name: string
    followers: number
  } | null
  mostLikedPost: {
    content: string
    likesCount: number
    authorName: string
  } | null
  mostCommentedPost: {
    content: string
    commentsCount: number
    authorName: string
  } | null
  mostSharedPost: {
    content: string
    sharesCount: number
    authorName: string
  } | null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(setData)
      .catch(() => setData(null))
  }, [])

  if (!data) {
    return <div className="text-center mt-20 text-xl">Carregando dados...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-10">📊 SocializeNow Dashboard</h1>

      <StatsCard title="Usuários Registrados" value={data.totalUsers} />
      <StatsCard title="Posts Publicados" value={data.totalPosts} />
      <StatsCard title="Usuários com Selo (Verificados)" value={data.verifiedUsersCount} />

      <DetailCard
        title="Usuário Mais Seguido"
        details={
          data.mostFollowedUser
            ? <>
                <p><strong>Nome:</strong> {data.mostFollowedUser.name}</p>
                <p><strong>Seguidores:</strong> {data.mostFollowedUser.followers}</p>
              </>
            : <p>Nenhum dado disponível</p>
        }
      />

      <PostCard
        title="Post Mais Curtido"
        post={data.mostLikedPost}
        countLabel="Número de Curtidas"
        countValue={data.mostLikedPost?.likesCount}
      />

      <PostCard
        title="Post Mais Comentado"
        post={data.mostCommentedPost}
        countLabel="Número de Comentários"
        countValue={data.mostCommentedPost?.commentsCount}
      />

      <PostCard
        title="Post Mais Compartilhado"
        post={data.mostSharedPost}
        countLabel="Número de Compartilhamentos"
        countValue={data.mostSharedPost?.sharesCount}
      />
    </div>
  )
}

function StatsCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition text-center">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{value}</p>
    </div>
  )
}

function DetailCard({ title, details }: { title: string; details: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="text-gray-800 dark:text-gray-300">{details}</div>
    </div>
  )
}

function PostCard({
  title,
  post,
  countLabel,
  countValue,
}: {
  title: string
  post: {
    content: string
    authorName: string
  } | null
  countLabel: string
  countValue?: number
}) {
  if (!post) {
    return (
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p>Nenhum post disponível</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <p className="mb-2 text-gray-700 dark:text-gray-300">
        <strong>Conteúdo:</strong> {post.content.length > 150 ? post.content.slice(0, 150) + "..." : post.content}
      </p>
      <p className="mb-1">
        <strong>Publicado por:</strong> {post.authorName}
      </p>
      <p>
        <strong>{countLabel}:</strong> {countValue ?? 0}
      </p>
    </div>
  )
}
