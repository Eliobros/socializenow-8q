"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function TestUserProfile() {
  const params = useParams()
  const userId = params.userId

  const [profile, setProfile] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    setError("")
    setProfile(null)

    fetch(`/api/profile/${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Erro desconhecido")
        }
        return res.json()
      })
      .then((data) => {
        setProfile(data.profile)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div style={{ padding: 20 }}>
      <h2>Teste perfil do usuário</h2>
      <p>UserId da URL: <b>{userId || "Não definido"}</b></p>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: "red" }}>Erro: {error}</p>}

      {profile && (
        <div style={{ marginTop: 20 }}>
          <p><b>Nome:</b> {profile.name}</p>
          <p><b>Email:</b> {profile.email}</p>
          <p><b>Username:</b> {profile.username}</p>
          <p><b>Followers:</b> {profile.followers}</p>
          <p><b>Following:</b> {profile.following}</p>
          <p><b>Posts count:</b> {profile.postsCount}</p>
          <img src={profile.avatar} alt="Avatar" width={100} height={100} style={{ borderRadius: "50%" }} />
        </div>
      )}
    </div>
  )
}
