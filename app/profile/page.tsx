"use client"

import React, { useEffect, useState } from "react"

interface Profile {
  _id: string
  name: string
  username: string
  email: string
  bio: string
  avatar?: string
  followers: number
  following: number
  postsCount: number
  isFollowing: boolean
}

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  console.log("Params recebidos na página:", params)

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token")
        console.log("Token do localStorage:", token)

        if (!token) {
          setError("Usuário não autenticado (token não encontrado)")
          setLoading(false)
          return
        }

        if (!params.userId) {
          setError("ID do usuário não informado")
          setLoading(false)
          return
        }

        const response = await fetch(`/api/profile/${params.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("Status da resposta da API:", response.status)

        if (!response.ok) {
          const errData = await response.json()
          console.log("Erro da API:", errData)
          setError(errData.error || "Erro desconhecido na API")
          setLoading(false)
          return
        }

        const data = await response.json()
        console.log("Dados recebidos da API:", data)

        if (!data.profile) {
          setError("Perfil não encontrado")
          setLoading(false)
          return
        }

        setProfile(data.profile)
        setLoading(false)
      } catch (err) {
        console.error("Erro ao buscar perfil:", err)
        setError("Erro inesperado ao buscar perfil")
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [params.userId])

  if (loading) return <div>Carregando perfil...</div>
  if (error) return <div style={{ color: "red" }}>{error}</div>
  if (!profile) return <div>Usuário não encontrado</div>

  return (
    <div>
      <h1>Perfil de {profile.name}</h1>
      <p>Username: {profile.username}</p>
      <p>Email: {profile.email}</p>
      <p>Bio: {profile.bio || "Sem biografia"}</p>
      <p>Seguidores: {profile.followers}</p>
      <p>Seguindo: {profile.following}</p>
      <p>Posts: {profile.postsCount}</p>
      <img src={profile.avatar} alt={`${profile.name} avatar`} width={150} />
      <p>Está seguindo? {profile.isFollowing ? "Sim" : "Não"}</p>
    </div>
  )
}
