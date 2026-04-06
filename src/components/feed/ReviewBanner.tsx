'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'

interface ReviewBannerProps {
  dueCount: number
  onStartReview: () => void
}

export function ReviewBanner({ dueCount, onStartReview }: ReviewBannerProps) {
  return (
    <AnimatePresence>
      {dueCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="absolute bottom-6 z-40"
          style={{ left: '1rem', right: '1rem' }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl"
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid oklch(74% 0.17 68 / 0.30)',
              background: 'oklch(12.5% 0.006 260 / 0.96)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px oklch(0% 0 0 / 0.40)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'oklch(74% 0.17 68 / 0.15)', border: '1px solid oklch(74% 0.17 68 / 0.30)' }}
            >
              <Bell className="w-3.5 h-3.5" style={{ color: 'oklch(74% 0.17 68)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'oklch(90% 0.010 80)' }}>
                {dueCount} card{dueCount !== 1 ? 's' : ''} due for review
              </p>
              <p className="text-xs" style={{ color: 'oklch(45% 0.010 260)' }}>
                Reinforce your memory
              </p>
            </div>
            <button
              onClick={onStartReview}
              className="shrink-0 h-8 rounded-full text-xs font-semibold transition-all duration-150 active:scale-[0.97]"
              style={{
                paddingLeft: '1rem',
                paddingRight: '1rem',
                background: 'oklch(74% 0.17 68)',
                color: 'oklch(14% 0.010 68)',
              }}
            >
              Review
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
