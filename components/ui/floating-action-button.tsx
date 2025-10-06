"use client"

import { Plus } from "lucide-react"
import { Button } from "./button"
import { useState } from "react"
import Link from "next/link"

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Sub-actions */}
      <div
        className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <Link href="/report/lost">
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white shadow-lg animate-in slide-in-from-bottom-2 duration-200"
          >
            Report Lost
          </Button>
        </Link>
        <Link href="/report/found">
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white shadow-lg animate-in slide-in-from-bottom-2 duration-300"
          >
            Report Found
          </Button>
        </Link>
      </div>

      {/* Main FAB */}
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 ${
          isOpen ? "rotate-45" : "rotate-0"
        }`}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
