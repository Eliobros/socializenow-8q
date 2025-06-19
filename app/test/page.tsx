// app/test/page.tsx
"use client"

import { BadgeCheck } from "lucide-react"

export default function TestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex items-center gap-2 text-blue-500 text-xl">
        <BadgeCheck className="w-6 h-6 text-blue-500" />
        <span>Verificado</span>
      </div>
    </main>
  )
}
