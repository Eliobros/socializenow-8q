"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, User, LogOut, Bell, MessageCircle, Search, Menu } from "lucide-react"

interface UserData {
  name: string
  email: string
}

export function Navbar() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      // Decode JWT to get user info (simplified)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUser({ name: payload.name, email: payload.email })
      } catch (error) {
        console.error("Error decoding token:", error)
      }
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isActive = (path: string) => pathname === path

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link href="/feed">
        <Button
          variant={isActive("/feed") ? "default" : "ghost"}
          size="sm"
          className={mobile ? "w-full justify-start gap-2" : "gap-2"}
        >
          <Home className="h-4 w-4" />
          {(mobile || !isMobile) && "Feed"}
        </Button>
      </Link>

      <Link href="/search">
        <Button
          variant={isActive("/search") ? "default" : "ghost"}
          size="sm"
          className={mobile ? "w-full justify-start gap-2" : "gap-2"}
        >
          <Search className="h-4 w-4" />
          {(mobile || !isMobile) && "Pesquisar"}
        </Button>
      </Link>

      <Link href="/notifications">
        <Button
          variant={isActive("/notifications") ? "default" : "ghost"}
          size="sm"
          className={mobile ? "w-full justify-start gap-2" : "gap-2"}
        >
          <Bell className="h-4 w-4" />
          {(mobile || !isMobile) && "Notificações"}
        </Button>
      </Link>

      <Link href="/messages">
        <Button
          variant={isActive("/messages") ? "default" : "ghost"}
          size="sm"
          className={mobile ? "w-full justify-start gap-2" : "gap-2"}
        >
          <MessageCircle className="h-4 w-4" />
          {(mobile || !isMobile) && "Mensagens"}
        </Button>
      </Link>
    </>
  )

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/feed" className="text-xl md:text-2xl font-bold">
            Socialize<span className="text-blue-600">Now</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavLinks />
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Navigation */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    <NavLinks mobile />
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
