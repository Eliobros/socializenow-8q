"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Loader2,
  Send,
  MessageCircle,
  Plus,
  ArrowLeft,
  Search,
  Phone,
  Video,
  Info,
  Camera,
  Mic,
  ImageIcon,
  Smile,
} from "lucide-react"

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
  const [searchTerm, setSearchTerm] = useState("")
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
    return conversation.participants.find((p) => p._id !== currentUserId)
  }

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="md:hidden">
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
        <div className="hidden md:block">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  // Mobile Layout
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return (
      <div className="min-h-screen bg-white">
        {!selectedConversation ? (
          // Lista de Conversas - Mobile
          <div className="h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowLeft className="h-6 w-6" onClick={() => router.back()} />
                  <h1 className="text-xl font-semibold">SocializeNow</h1>
                </div>
                <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <Plus className="h-6 w-6" />
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
                          {searchUsers.map((user) => (
                            <div
                              key={user._id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                              onClick={() => startNewConversation(user._id)}
                            >
                              <Avatar className="h-12 w-12">
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
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-200 rounded-full"
                />
              </div>
            </div>

            {/* Stories Section */}
            <div className="px-4 py-3">
              <ScrollArea className="w-full">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 min-w-[70px]">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <Plus className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">Sua nota</span>
                  </div>
                  {filteredConversations.slice(0, 5).map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation)
                    if (!otherParticipant) return null
                    return (
                      <div key={conversation._id} className="flex flex-col items-center gap-2 min-w-[70px]">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                          <Avatar className="w-full h-full">
                            <AvatarFallback className="bg-blue-600 text-white">
                              {getInitials(otherParticipant.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="text-xs text-gray-600 truncate w-16 text-center">
                          {otherParticipant.name.split(" ")[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Messages Tab */}
            <div className="flex border-b border-gray-200">
              <div className="flex-1 text-center py-3">
                <span className="font-semibold text-black border-b-2 border-black pb-3">Mensagens</span>
              </div>
              <div className="flex-1 text-center py-3">
                <span className="text-blue-500">Pedidos</span>
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation)
                    if (!otherParticipant) return null

                    return (
                      <div
                        key={conversation._id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedConversation(conversation._id)
                          fetchMessages(conversation._id)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-14 w-14">
                              <AvatarFallback className="bg-blue-600 text-white">
                                {getInitials(otherParticipant.name)}
                              </AvatarFallback>
                            </Avatar>
                            {otherParticipant.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-black truncate">{otherParticipant.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {formatMessageTime(conversation.lastMessage.createdAt)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.content}</p>
                            </div>
                            <p className="text-xs text-gray-400">{formatLastSeen(otherParticipant.lastSeen)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          // Chat Individual - Mobile
          <div className="h-screen flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              {(() => {
                const conversation = conversations.find((c) => c._id === selectedConversation)
                const otherParticipant = conversation ? getOtherParticipant(conversation) : null
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowLeft className="h-6 w-6 cursor-pointer" onClick={() => setSelectedConversation(null)} />
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {otherParticipant ? getInitials(otherParticipant.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        {otherParticipant?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-black">
                          {otherParticipant ? otherParticipant.name : "Usuário"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {otherParticipant ? formatLastSeen(otherParticipant.lastSeen) : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone className="h-6 w-6 text-gray-600" />
                      <Video className="h-6 w-6 text-gray-600" />
                      <Info className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-2 min-h-0">
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const showTimestamp =
                    index === 0 ||
                    new Date(messages[index - 1].createdAt).getDate() !== new Date(message.createdAt).getDate()

                  return (
                    <div key={message._id}>
                      {showTimestamp && (
                        <div className="text-center my-4">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${message.sender._id === currentUserId ? "justify-end" : "justify-start"}`}>
                        {message.sender._id !== currentUserId && (
                          <Avatar className="h-8 w-8 mr-2 mt-1">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(message.sender.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                            message.sender._id === currentUserId
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-gray-200 text-gray-800 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-4 py-2 flex-shrink-0">
              <form onSubmit={sendMessage} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-6 w-6 text-blue-500" />
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                  <Mic className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Envie uma mensagem..."
                    className="rounded-full border-gray-300 pr-10"
                    disabled={sending}
                  />
                  <Smile className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="rounded-full w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop Layout (mantém o layout original)
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Conversas - Desktop */}
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

          {/* Área de Mensagens - Desktop */}
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

                <div className="border-t p-4 flex-shrink-0">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()}>
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

