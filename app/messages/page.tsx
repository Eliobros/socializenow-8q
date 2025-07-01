"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Send, MessageCircle, Plus, ImageIcon, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface Message {
  _id: string
  content: string
  image?: string
  sender: {
    _id: string
    name: string
    avatar: string
  }
  receiver: {
    _id: string
    name: string
    avatar: string
  }
  createdAt: string
  read: boolean
}

interface Conversation {
  _id: string
  participants: Array<{
    _id: string
    name: string
    avatar: string
    lastSeen?: string
    isOnline?: boolean
  }>
  lastMessage: {
    content: string
    createdAt: string
    sender: string
  }
  unreadCount: number
}

interface User {
  _id: string
  name: string
  username: string
  avatar: string
  lastSeen?: string
  isOnline?: boolean
}

export default function MessagesPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [searchUsers, setSearchUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchConversations()

      const conversationId = searchParams.get("conversation")
      if (conversationId) {
        setSelectedConversation(conversationId)
        fetchMessages(conversationId)
      }

      const interval = setInterval(() => {
        fetchConversations()
        if (selectedConversation) {
          fetchMessages(selectedConversation)
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [authLoading, isAuthenticated, user, selectedConversation, searchParams])

  useEffect(() => {
    if (shouldAutoScroll && !isUserScrolling && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [messages, shouldAutoScroll, isUserScrolling])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50

    if (!isAtBottom && shouldAutoScroll) {
      setIsUserScrolling(true)
      setShouldAutoScroll(false)
    } else if (isAtBottom && !shouldAutoScroll) {
      setIsUserScrolling(false)
      setShouldAutoScroll(true)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/messages/conversations", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      } else {
        setError("Erro ao carregar conversas")
      }
    } catch (error) {
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens")
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 10MB")
      return
    }

    setSelectedImage(file)
    setError("")

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation) return

    setSending(true)
    try {
      if (selectedImage) {
        const formData = new FormData()
        formData.append("conversationId", selectedConversation)
        formData.append("content", newMessage)
        formData.append("image", selectedImage)

        const response = await fetch("/api/messages", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        if (response.ok) {
          setNewMessage("")
          removeImage()
          fetchMessages(selectedConversation)
          fetchConversations()
        }
      } else {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            conversationId: selectedConversation,
            content: newMessage,
          }),
        })

        if (response.ok) {
          setNewMessage("")
          fetchMessages(selectedConversation)
          fetchConversations()
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem")
    } finally {
      setSending(false)
    }
  }

  const searchUsersForChat = async (query: string) => {
    if (!query.trim()) {
      setSearchUsers([])
      return
    }

    setSearchingUsers(true)
    try {
      const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setSearchUsers(data.users)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários")
    } finally {
      setSearchingUsers(false)
    }
  }

  const startNewConversation = async (userId: string) => {
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversationId)
        fetchMessages(data.conversationId)
        fetchConversations()
        setShowNewChatDialog(false)
        setUserSearchTerm("")
        setSearchUsers([])
      }
    } catch (error) {
      console.error("Erro ao iniciar conversa")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Offline"

    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Online"
    if (diffInMinutes < 60) return `Online há ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Online há ${Math.floor(diffInMinutes / 60)}h`
    return `Online há ${Math.floor(diffInMinutes / 1440)} dias`
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return formatTime(dateString)
    } else if (diffInHours < 48) {
      return "Ontem"
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== user?.id)
  }

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Resto do componente permanece igual, apenas removendo as verificações de localStorage
  // e usando user?.id em vez de currentUserId
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border">
            <div className="flex flex-row items-center justify-between p-4 border-b">
              <h2 className="flex items-center gap-2 font-semibold">
                <MessageCircle className="h-5 w-5" />
                Mensagens
              </h2>
              <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Buscar usuários..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value)
                        searchUsersForChat(e.target.value)
                      }}
                    />
                    <ScrollArea className="h-60">
                      <div className="space-y-2">
                        {searchUsers.map((searchUser) => (
                          <div
                            key={searchUser._id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            onClick={() => startNewConversation(searchUser._id)}
                          >
                            <Avatar className="h-12 w-12">
                              {searchUser.avatar && (
                                <AvatarImage src={searchUser.avatar || "/placeholder.svg"} alt={searchUser.name} />
                              )}
                              <AvatarFallback className="bg-blue-600 text-white">
                                {getInitials(searchUser.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{searchUser.name}</p>
                              {searchUser.username && <p className="text-sm text-gray-500">@{searchUser.username}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
              {conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation)
                  if (!otherParticipant) return null

                  return (
                    <div
                      key={conversation._id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation._id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation._id)
                        fetchMessages(conversation._id)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            {otherParticipant?.avatar ? (
                              <AvatarImage
                                src={otherParticipant?.avatar || "/placeholder.svg"}
                                alt={otherParticipant?.name || ""}
                              />
                            ) : null}
                            <AvatarFallback className="bg-blue-600 text-white">
                              {getInitials(otherParticipant.name)}
                            </AvatarFallback>
                          </Avatar>
                          {otherParticipant.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{otherParticipant.name}</p>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(conversation.lastMessage.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.content}</p>
                          <p className="text-xs text-gray-400">{formatLastSeen(otherParticipant.lastSeen)}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </ScrollArea>
          </div>

          <div className="lg:col-span-2 h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border flex flex-col">
            {selectedConversation ? (
              <>
                <div className="border-b p-4 flex-shrink-0">
                  {(() => {
                    const conversation = conversations.find((c) => c._id === selectedConversation)
                    const otherParticipant = conversation ? getOtherParticipant(conversation) : null
                    return (
                      <div className="flex items-center gap-3">
                        {otherParticipant && (
                          <>
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                {otherParticipant?.avatar ? (
                                  <AvatarImage
                                    src={otherParticipant?.avatar || "/placeholder.svg"}
                                    alt={otherParticipant?.name || ""}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-blue-600 text-white">
                                  {getInitials(otherParticipant.name)}
                                </AvatarFallback>
                              </Avatar>
                              {otherParticipant.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{otherParticipant.name}</p>
                              <p className="text-sm text-gray-500">{formatLastSeen(otherParticipant.lastSeen)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.sender._id === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender._id === user?.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {message.image && (
                            <img
                              src={message.image || "/placeholder.svg"}
                              alt="Imagem"
                              className="w-full rounded-lg mb-2 cursor-pointer"
                              onClick={() => window.open(message.image, "_blank")}
                            />
                          )}
                          {message.content && <p className="text-sm">{message.content}</p>}
                          <p
                            className={`text-xs mt-1 ${
                              message.sender._id === user?.id ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {imagePreview && (
                  <div className="px-4 py-2 bg-gray-50 border-t">
                    <div className="relative inline-block">
                      <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-h-32 rounded-lg" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-t p-4 flex-shrink-0">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button type="submit" disabled={sending || (!newMessage.trim() && !selectedImage)}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione uma conversa para começar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
