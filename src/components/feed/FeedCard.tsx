'use client'

import { motion } from 'framer-motion'
import { ThumbsUp, Bookmark, Quote, Code2, BarChart3, Lightbulb, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedItem } from '@/types/index'
import { VisualType } from '@/types/index'

interface FeedCardProps {
  item: FeedItem
  isActive: boolean
  onGotIt: () => void
  onReviewLater: () => void
}

const TYPE_META = {
  [VisualType.QUOTE]:   { icon: Quote,     label: 'Quote',   accent: 'text-amber-400'   },
  [VisualType.CODE]:    { icon: Code2,     label: 'Code',    accent: 'text-emerald-400' },
  [VisualType.STAT]:    { icon: BarChart3, label: 'Stat',    accent: 'text-sky-400'     },
  [VisualType.TIP]:     { icon: Lightbulb, label: 'Tip',     accent: 'text-yellow-400'  },
  [VisualType.DIAGRAM]: { icon: GitBranch, label: 'Concept', accent: 'text-violet-400'  },
}

/* ── Visual area — distinct treatment per type ───────────────────────────── */
function VisualArea({ item }: { item: FeedItem }) {
  switch (item.visualType) {

    case VisualType.QUOTE:
      return (
        <div className="relative py-5 px-1">
          {/* Giant decorative quote */}
          <span
            aria-hidden
            className="absolute -top-2 left-0 leading-none select-none pointer-events-none"
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '6rem',
              color: 'oklch(74% 0.17 68 / 0.15)',
              lineHeight: 1,
            }}
          >
            &ldquo;
          </span>
          <blockquote
            className="pl-5 border-l-2 text-base italic leading-relaxed"
            style={{
              borderColor: 'oklch(74% 0.17 68 / 0.50)',
              color: 'oklch(88% 0.010 80)',
            }}
          >
            {item.body}
          </blockquote>
        </div>
      )

    case VisualType.CODE: {
      const code = item.visualCode
        ? item.visualCode.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
        : item.body
      return (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'oklch(23% 0.012 260)', background: 'oklch(7% 0.004 260)' }}>
          {/* macOS traffic lights */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-b" style={{ borderColor: 'oklch(18% 0.006 260)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
          </div>
          <pre className="p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: 'var(--font-mono)', color: 'oklch(75% 0.14 165)' }}>
            <code>{code}</code>
          </pre>
        </div>
      )
    }

    case VisualType.STAT: {
      const combined = item.hook + ' ' + item.body
      const numMatch = combined.match(
        /(\d[\d,.]*)(?:\s*(?:%|×|x|X|times?|faster|more|billion|million|thousand|ms|s|seconds?|hrs?|hours?|days?|weeks?|months?|years?))?/i
      )
      const stat = numMatch ? numMatch[0].trim() : null
      if (!stat) return null
      return (
        <div className="py-4">
          <div
            className="text-[4.5rem] font-black leading-none tracking-tight tabular-nums"
            style={{ fontFamily: 'var(--font-headline)', color: 'oklch(74% 0.17 68)' }}
          >
            {stat}
          </div>
          <div className="mt-3 h-px w-14 rounded-full" style={{ background: 'oklch(74% 0.17 68 / 0.35)' }} />
        </div>
      )
    }

    case VisualType.TIP:
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-3.5 h-3.5 shrink-0" style={{ color: 'oklch(74% 0.17 68)' }} />
            <div className="h-px flex-1" style={{ background: 'oklch(23% 0.012 260)' }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'oklch(82% 0.010 80)' }}>
            {item.body}
          </p>
        </div>
      )

    case VisualType.DIAGRAM:
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-3.5 h-3.5 shrink-0 text-violet-400/60" />
            <div className="h-px flex-1" style={{ background: 'oklch(23% 0.012 260)' }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'oklch(82% 0.010 80)' }}>
            {item.body}
          </p>
        </div>
      )

    default:
      return null
  }
}

/* ── Mastery indicator ───────────────────────────────────────────────────── */
function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Mastery level ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i < level ? '18px' : '6px',
            height: '4px',
            background: i < level
              ? 'oklch(74% 0.17 68)'
              : 'oklch(30% 0.010 260)',
          }}
        />
      ))}
    </div>
  )
}

/* ── Card ────────────────────────────────────────────────────────────────── */
export function FeedCard({ item, isActive, onGotIt, onReviewLater }: FeedCardProps) {
  const meta = TYPE_META[item.visualType]
  const Icon = meta.icon

  /* Body shown separately only for STAT/DIAGRAM — others embed it in the visual */
  const showBodyBelow = item.visualType === VisualType.STAT || item.visualType === VisualType.DIAGRAM

  return (
    <motion.div
      className="feed-item flex flex-col p-4 pb-6"
      style={{ 
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 52px)',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        paddingBottom: '1.5rem',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isActive ? 1 : 0.45, scale: isActive ? 1 : 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Card container */}
      <div 
        className="relative flex flex-col flex-1 h-full rounded-3xl overflow-hidden shadow-2xl"
        style={{ 
          background: 'var(--color-card-bg)', 
          border: '1px solid var(--color-card-border)' 
        }}
      >
        {/* Content column */}
        <div 
          className="relative flex flex-col flex-1 min-h-0"
          style={{ padding: '1.5rem', paddingBottom: '2rem' }}
        >

        {/* ── Type label — quiet, uppercase, tracked ── */}
        <motion.div
          className="shrink-0 mb-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: isActive ? 1 : 0, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <span className={cn(
            'inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase',
            meta.accent
          )}>
            <Icon className="w-3 h-3" />
            {meta.label}
          </span>
        </motion.div>

        {/* ── Centered content zone — headline + visual + body ── */}
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-5">
          {/* Headline */}
          <motion.h2
            className="font-bold leading-[1.15]"
            style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 'clamp(1.75rem, 6vw, 2.2rem)',
              color: 'oklch(95% 0.008 80)',
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: isActive ? 1 : 0, y: 0 }}
            transition={{ delay: 0.10, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {item.hook}
          </motion.h2>

          {/* Visual area + body */}
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: isActive ? 1 : 0, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <VisualArea item={item} />
            {showBodyBelow && (
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'oklch(68% 0.012 80)' }}
              >
                {item.body}
              </p>
            )}
          </motion.div>
        </div>

        {/* ── Bottom actions ── */}
        <motion.div
          className="shrink-0 pt-5 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 1 : 0 }}
          transition={{ delay: 0.24, duration: 0.3 }}
        >
          {/* Divider */}
          <div className="h-px" style={{ background: 'oklch(23% 0.012 260)' }} />

          <div className="flex gap-3">
            {/* Review Later */}
            <button
              onClick={onReviewLater}
              className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]"
              style={{
                border: '1px solid oklch(28% 0.012 260)',
                color: 'oklch(58% 0.015 260)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'oklch(38% 0.015 260)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'oklch(78% 0.010 80)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'oklch(28% 0.012 260)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'oklch(58% 0.015 260)'
              }}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Review Later
            </button>

            {/* Got it! — amber accent */}
            <button
              onClick={onGotIt}
              className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-150 active:scale-[0.97]"
              style={{
                border: '1px solid oklch(74% 0.17 68 / 0.55)',
                background: 'oklch(74% 0.17 68 / 0.10)',
                color: 'oklch(74% 0.17 68)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'oklch(74% 0.17 68 / 0.18)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'oklch(74% 0.17 68 / 0.10)'
              }}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Got it
            </button>
          </div>

          {/* Mastery */}
          <div className="flex items-center justify-between">
            <MasteryDots level={item.masteryLevel} />
            <span className="text-[10px] tracking-wider uppercase" style={{ color: 'oklch(38% 0.010 260)' }}>
              Mastery
            </span>
          </div>
        </motion.div>
        
        </div>
      </div>
    </motion.div>
  )
}
