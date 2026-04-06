'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ModelLoadingOverlayProps {
  visible: boolean
  progress: number
  isCached?: boolean
}

export function ModelLoadingOverlay({ visible, progress, isCached = false }: ModelLoadingOverlayProps) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8"
          style={{ background: 'oklch(9.5% 0.006 260 / 0.97)', backdropFilter: 'blur(8px)' }}
        >
          {/* Progress ring */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 88 88">
              <circle
                cx="44" cy="44" r={r}
                fill="none"
                stroke="oklch(20% 0.008 260)"
                strokeWidth="3"
              />
              <circle
                cx="44" cy="44" r={r}
                fill="none"
                stroke="oklch(74% 0.17 68)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>
            <span
              className="relative text-xl font-black tabular-nums"
              style={{
                fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif',
                color: 'oklch(74% 0.17 68)',
              }}
            >
              {progress}%
            </span>
          </div>

          {/* Status */}
          <div className="text-center space-y-2" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>
            <p
              className="font-semibold text-base"
              style={{ color: 'oklch(93% 0.010 80)' }}
            >
              {isCached ? 'Loading from cache…' : 'Downloading AI model'}
            </p>
            <p className="text-sm" style={{ color: 'oklch(45% 0.010 260)' }}>
              {isCached
                ? 'Initializing Gemma 4 — just a moment'
                : 'One-time download (~2 GB) · Stored on your device'}
            </p>
          </div>

          {/* Privacy badge */}
          <div
            className="flex items-center gap-2 rounded-full"
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid oklch(23% 0.012 260)',
              background: 'oklch(15% 0.006 260)',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs" style={{ color: 'oklch(52% 0.015 260)' }}>
              Runs 100% locally — nothing leaves your device
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
