"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  isVerified?: boolean
  followers?: number
  following?: number
  postsCount?: number
  isEmailVerified: boolean
  verificationCode?: string
  codeExpires?: Date
  createdAt: Date
  updatedAt?: Date
  lastSeen?: Date
  isOnline?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include", // Inclui cookies
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Não está autenticado, redireciona para login
        router.push("/login")
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  }
}
