'use client'

import { Plus } from 'lucide-react'

interface TopBarProps {
  cardCount?: number
  onAddContent: () => void
}

export function TopBar({ cardCount = 0, onAddContent }: TopBarProps) {
  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between"
      style={{
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
        paddingBottom: '12px',
        background: 'linear-gradient(to bottom, oklch(9.5% 0.006 260 / 0.95) 60%, oklch(9.5% 0.006 260 / 0))',
      }}
    >
      {/* Wordmark */}
      <span
        className="text-xl font-bold italic tracking-tight select-none"
        style={{
          fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif',
          color: 'oklch(93% 0.010 80)',
          letterSpacing: '-0.01em',
        }}
      >
        feedify
      </span>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {cardCount > 0 && (
          <span
            className="text-xs tabular-nums"
            style={{ color: 'oklch(45% 0.010 260)' }}
          >
            {cardCount} cards
          </span>
        )}
        <button
          onClick={onAddContent}
          aria-label="Add new content"
          className="flex items-center gap-1.5 h-8 rounded-full text-xs font-semibold transition-all duration-150 active:scale-[0.96]"
          style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            border: '1px solid oklch(74% 0.17 68 / 0.50)',
            background: 'oklch(74% 0.17 68 / 0.08)',
            color: 'oklch(74% 0.17 68)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'oklch(74% 0.17 68)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'oklch(14% 0.010 68)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'oklch(74% 0.17 68 / 0.08)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'oklch(74% 0.17 68)'
          }}
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>
    </div>
  )
}
