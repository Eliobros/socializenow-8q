"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Send, MessageCircle, Plus } from "lucide-react"

interface Message {
  _id: string
  content: string
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
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [currentUserId, setCurrentUserId] = useState("")
  const [searchUsers, setSearchUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    // Decode JWT to get user ID
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      setCurrentUserId(payload.userId)
    } catch (error) {
      console.error("Error decoding token:", error)
    }

    fetchConversations()

    // Check if there's a conversation ID in the URL
    const conversationId = searchParams.get("conversation")
    if (conversationId) {
      setSelectedConversation(conversationId)
      fetchMessages(conversationId)
    }

    // Simular mensagens em tempo real
    const interval = setInterval(() => {
      fetchConversations()
      if (selectedConversation) {
        fetchMessages(selectedConversation)
      }
    }, 5000) // Atualiza a cada 5 segundos

    return () => clearInterval(interval)
  }, [router, selectedConversation, searchParams])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/messages/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/messages/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens")
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("token")
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return formatTime(dateString)
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== currentUserId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Lista de Conversas */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Mensagens</span>
              </CardTitle>
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
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar usuários..."
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value)
                          searchUsersForChat(e.target.value)
                        }}
                        className="flex-1"
                      />
                      {searchingUsers && <Loader2 className="h-4 w-4 animate-spin mt-3" />}
                    </div>
                    <ScrollArea className="h-60">
                      <div className="space-y-2">
                        {searchUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            onClick={() => startNewConversation(user._id)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-blue-600 text-white">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
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
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-600 text-white">
                              {getInitials(otherParticipant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{otherParticipant.name}</p>
                              <span className="text-xs text-gray-500">
                                {formatDate(conversation.lastMessage.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.content}</p>
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
            </CardContent>
          </Card>

          {/* Área de Mensagens */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle>
                    {(() => {
                      const conversation = conversations.find((c) => c._id === selectedConversation)
                      const otherParticipant = conversation ? getOtherParticipant(conversation) : null
                      return otherParticipant ? otherParticipant.name : "Conversa"
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[500px]">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.sender._id === currentUserId ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender._id === currentUserId
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender._id === currentUserId ? "text-blue-100" : "text-gray-500"
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

                  <div className="border-t p-4">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={sending || !newMessage.trim()}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione uma conversa para começar</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
