export interface User {
  _id: string
  name: string
  email: string
  username: string
  password: string
  bio?: string
  avatar?: string
  followers?: number
  following?: number
  postsCount?: number
  isEmailVerified: boolean
  verificationCode?: string
  codeExpires?: Date
  isVerified?: boolean // Para o selo de verificação
  createdAt: Date
  updatedAt?: Date
  lastSeen?: Date
  isOnline?: boolean
}

export interface UserProfile {
  _id: string
  name: string
  username: string
  email: string
  bio: string
  avatar: string
  followers: number
  following: number
  postsCount: number
  createdAt: string
  isVerified: boolean
  isEmailVerified: boolean
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  isVerified?: boolean
}

export interface LoginResponse {
  message: string
  user: AuthUser
}

export interface RegisterResponse {
  message: string
  userId: string
}
