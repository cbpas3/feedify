'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Cpu } from 'lucide-react'

interface ModelLoadingOverlayProps {
  visible: boolean
  progress: number
  isCached?: boolean
}

export function ModelLoadingOverlay({ visible, progress, isCached = false }: ModelLoadingOverlayProps) {
  const circumference = 2 * Math.PI * 40 // r=40
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[--background]/95 backdrop-blur-md"
        >
          {/* Progress ring */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-[--border]"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-[--primary] transition-all duration-300"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="relative flex flex-col items-center gap-1">
              {progress < 100 ? (
                <span className="text-xl font-bold text-white">{progress}%</span>
              ) : (
                <Cpu className="w-7 h-7 text-[--primary]" />
              )}
            </div>
          </div>

          {/* Status text */}
          <div className="text-center space-y-1 px-8">
            <p className="text-white font-semibold">
              {isCached ? 'Loading AI model...' : 'Downloading AI model'}
            </p>
            <p className="text-white/50 text-sm">
              {isCached
                ? 'Initializing from cache'
                : 'One-time download (~1.4 GB) — stored on your device'}
            </p>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[--muted] border border-[--border]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-xs text-white/60">Runs 100% locally — no data leaves your device</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
