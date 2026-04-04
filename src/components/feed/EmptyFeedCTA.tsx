'use client'

import { motion } from 'framer-motion'
import { Zap, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyFeedCTAProps {
  onAddContent: () => void
}

export function EmptyFeedCTA({ onAddContent }: EmptyFeedCTAProps) {
  return (
    <div className="feed-item flex flex-col items-center justify-center gap-6 px-8 text-center bg-[--card-bg]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-20 h-20 rounded-2xl bg-[--primary]/20 flex items-center justify-center"
      >
        <Zap className="w-10 h-10 text-[--primary]" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold text-white">Start Learning</h2>
        <p className="text-white/60 leading-relaxed">
          Paste any article, document, or URL and Feedify will transform it into a bite-sized learning feed — powered entirely by AI running on your device.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button onClick={onAddContent} size="lg" className="gap-2 px-8 h-14 text-base font-semibold rounded-xl">
          <Plus className="w-5 h-5" />
          Add Your First Content
        </Button>
      </motion.div>
    </div>
  )
}
