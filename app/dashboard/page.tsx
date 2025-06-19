// app/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { User, FileText, ThumbsUp, MessageCircle, Share2, Award } from "lucide-react"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-pulse text-xl text-zinc-600 dark:text-zinc-300">📡 Carregando dados do painel...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-10">📊 SocializeNow Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Usuários Registrados" value={data.totalUsers} icon={<User />} />
        <Card title="Posts Publicados" value={data.totalPosts} icon={<FileText />} />
        <Card title="Usuário Mais Seguido" value={data.mostFollowedUser?.name || "N/A"} icon={<Award />} />
        <Card title="Post Mais Curtido" value={data.mostLikedPost?.content?.slice(0, 50) + "..."} icon={<ThumbsUp />} />
        <Card title="Mais Comentado" value={data.mostCommentedPost?.content?.slice(0, 50) + "..."} icon={<MessageCircle />} />
        <Card title="Mais Compartilhado" value={data.mostSharedPost?.content?.slice(0, 50) + "..."} icon={<Share2 />} />
      </div>
    </div>
  )
}

function Card({ title, value, icon }: { title: string; value: any; icon: JSX.Element }) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-3 mb-3 text-indigo-600 dark:text-indigo-400">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="text-2xl font-bold text-zinc-800 dark:text-white truncate">{value}</p>
    </div>
  )
}

