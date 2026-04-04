'use client'

import { Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TopBarProps {
  cardCount?: number
  onAddContent: () => void
}

export function TopBar({ cardCount = 0, onAddContent }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-safe-top pb-3 bg-gradient-to-b from-[--background]/90 to-transparent backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[--primary] flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">Feedify</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {cardCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {cardCount} cards
          </Badge>
        )}
        <Button
          onClick={onAddContent}
          size="sm"
          className="gap-1.5 rounded-full px-3"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
    </div>
  )
}
