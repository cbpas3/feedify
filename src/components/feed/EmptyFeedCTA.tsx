'use client'

import { motion } from 'framer-motion'
import { Plus, BookOpen } from 'lucide-react'

interface EmptyFeedCTAProps {
  onAddContent: () => void
}

export function EmptyFeedCTA({ onAddContent }: EmptyFeedCTAProps) {
  return (
    <div
      className="feed-item flex flex-col items-center justify-center gap-10 text-center"
      style={{ background: 'var(--color-card-bg)', paddingLeft: '2rem', paddingRight: '2rem' }}
    >
      {/* Icon — concentric amber rings */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="relative flex items-center justify-center"
      >
        <div
          className="absolute w-28 h-28 rounded-full"
          style={{ border: '1px solid oklch(74% 0.17 68 / 0.10)' }}
        />
        <div
          className="absolute w-20 h-20 rounded-full"
          style={{ border: '1px solid oklch(74% 0.17 68 / 0.20)' }}
        />
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            border: '1px solid oklch(74% 0.17 68 / 0.40)',
            background: 'oklch(74% 0.17 68 / 0.08)',
          }}
        >
          <BookOpen className="w-6 h-6" style={{ color: 'oklch(74% 0.17 68)' }} />
        </div>
      </motion.div>

      {/* Copy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="space-y-3 max-w-70"
      >
        <h2
          className="font-bold leading-tight"
          style={{
            fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif',
            fontSize: '2rem',
            color: 'oklch(93% 0.010 80)',
          }}
        >
          Your learning<br />feed starts here.
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'oklch(52% 0.015 260)' }}>
          Paste any article, doc, or URL — Feedify transforms it into focused learning cards powered by on-device AI.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <button
          onClick={onAddContent}
          className="flex items-center gap-2 h-12 rounded-full text-sm font-semibold transition-all duration-150 active:scale-[0.97] hover:opacity-90"
          style={{
            paddingLeft: '2rem',
            paddingRight: '2rem',
            background: 'oklch(74% 0.17 68)',
            color: 'oklch(14% 0.010 68)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add your first content
        </button>
      </motion.div>
    </div>
  )
}
