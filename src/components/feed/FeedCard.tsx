'use client'

import { motion } from 'framer-motion'
import { ThumbsUp, Bookmark, Zap, Quote, Code2, BarChart3, Lightbulb, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { FeedItem } from '@/types/index'
import { VisualType } from '@/types/index'

interface FeedCardProps {
  item: FeedItem
  isActive: boolean
  onGotIt: () => void
  onReviewLater: () => void
}

const VISUAL_TYPE_CONFIG = {
  [VisualType.QUOTE]: { icon: Quote, label: 'Quote', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  [VisualType.CODE]: { icon: Code2, label: 'Code', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  [VisualType.STAT]: { icon: BarChart3, label: 'Stat', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  [VisualType.TIP]: { icon: Lightbulb, label: 'Tip', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  [VisualType.DIAGRAM]: { icon: GitBranch, label: 'Diagram', color: 'text-purple-400', bg: 'bg-purple-400/10' },
}

function VisualArea({ item }: { item: FeedItem }) {
  const config = VISUAL_TYPE_CONFIG[item.visualType]

  switch (item.visualType) {
    case VisualType.QUOTE:
      return (
        <div className="relative px-4 py-3 rounded-xl border border-amber-400/20 bg-amber-400/5">
          <Quote className="absolute top-3 left-3 w-4 h-4 text-amber-400/40" />
          <p className="pl-6 text-sm text-amber-100/80 italic leading-relaxed">
            {item.hook}
          </p>
        </div>
      )

    case VisualType.CODE:
      return (
        <div className="rounded-xl overflow-hidden border border-emerald-400/20 bg-black/40">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-emerald-400/10 bg-emerald-400/5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <pre className="p-3 text-xs text-emerald-300 overflow-x-auto font-mono leading-relaxed">
            <code>
              {item.visualCode
                ? item.visualCode.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
                : item.body}
            </code>
          </pre>
        </div>
      )

    case VisualType.STAT: {
      // Extract number/percentage from hook or body
      const statMatch = (item.hook + ' ' + item.body).match(/(\d+(?:[.,]\d+)?(?:\s*%|\s*x|\s*X)?(?:\s*times?)?(?:\s*faster?)?(?:\s*more?)?(?:\s*billion)?(?:\s*million)?(?:\s*thousand)?)/i)
      const stat = statMatch ? statMatch[1] : item.hook.slice(0, 20)
      return (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <span className="text-5xl font-black text-blue-300 tracking-tight">{stat}</span>
          <div className="h-1 w-16 rounded-full bg-blue-400/30" />
        </div>
      )
    }

    case VisualType.TIP:
      return (
        <div className="flex gap-3 items-start px-4 py-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5">
          <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-100/80 leading-relaxed">{item.body}</p>
        </div>
      )

    case VisualType.DIAGRAM:
      return (
        <div className="flex flex-col items-center justify-center py-4 gap-2 rounded-xl border border-purple-400/20 bg-purple-400/5">
          <GitBranch className="w-8 h-8 text-purple-400/60" />
          <p className="text-xs text-purple-300/60 text-center px-4">
            Conceptual diagram — see body text for details
          </p>
        </div>
      )

    default:
      return null
  }
}

function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors duration-300',
            i < level ? 'bg-[--primary]' : 'bg-white/20'
          )}
        />
      ))}
    </div>
  )
}

export function FeedCard({ item, isActive, onGotIt, onReviewLater }: FeedCardProps) {
  const config = VISUAL_TYPE_CONFIG[item.visualType]
  const Icon = config.icon

  return (
    <motion.div
      className="feed-item flex flex-col"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: isActive ? 1 : 0.6, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Card background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[--card-bg] via-[--card-bg] to-[--card-bg]/95" />

      {/* Subtle ambient glow based on visual type */}
      <div
        className={cn(
          'absolute inset-0 opacity-10 pointer-events-none',
          'bg-gradient-radial from-current to-transparent',
          config.color
        )}
        style={{
          background: `radial-gradient(ellipse 80% 40% at 50% 0%, currentColor 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col h-full px-5 pt-safe-top pb-safe-bottom">
        {/* Top: Visual type badge */}
        <div className="pt-4 pb-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            config.bg, config.color
          )}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>

        {/* Middle: Main content */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          {/* Hook headline */}
          <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">
            {item.hook}
          </h2>

          {/* Visual area */}
          <VisualArea item={item} />

          {/* Body text (hidden for CODE/TIP since visual area shows it) */}
          {item.visualType !== VisualType.CODE && item.visualType !== VisualType.TIP && (
            <p className="text-base text-white/70 leading-relaxed">
              {item.body}
            </p>
          )}
        </div>

        {/* Bottom: Actions + mastery */}
        <div className="pb-6 flex flex-col gap-4">
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onReviewLater}
              variant="outline"
              className="flex-1 h-12 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Bookmark className="w-4 h-4" />
              Review Later
            </Button>
            <Button
              onClick={onGotIt}
              className="flex-1 h-12 bg-[--primary] text-white"
            >
              <ThumbsUp className="w-4 h-4" />
              Got it!
            </Button>
          </div>

          {/* Progress & mastery */}
          <div className="flex items-center justify-between">
            <MasteryDots level={item.masteryLevel} />
            <span className="text-xs text-white/30">
              {item.orderIndex + 1} of {item.orderIndex + 1}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
