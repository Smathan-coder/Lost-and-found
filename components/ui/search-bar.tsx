"use client"

import { Search, Filter, MapPin } from "lucide-react"
import { Input } from "./input"
import { Button } from "./button"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"

interface SearchBarProps {
  onSearch?: (query: string) => void
  onFilter?: (filters: any) => void
  onLocationSearch?: () => void
  placeholder?: string
}

function SearchBar({ onSearch, onFilter, onLocationSearch, placeholder = "Search for items..." }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch?.(value)
  }

  return (
    <div className={`relative transition-all duration-300 ${isExpanded ? "scale-105" : "scale-100"}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
          className="pl-10 pr-20 h-12 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-full transition-all duration-300 focus:shadow-xl"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onLocationSearch}
            className="rounded-full h-8 w-8 p-0 hover:bg-blue-100"
          >
            <MapPin className="h-4 w-4 text-blue-600" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0 hover:bg-purple-100">
                <Filter className="h-4 w-4 text-purple-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onFilter?.({ category: "electronics" })}>Electronics</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilter?.({ category: "clothing" })}>Clothing</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilter?.({ category: "accessories" })}>Accessories</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilter?.({ category: "documents" })}>Documents</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilter?.({ timeRange: "today" })}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFilter?.({ timeRange: "week" })}>This Week</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export { SearchBar }
export default SearchBar
