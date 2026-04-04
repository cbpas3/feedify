'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-4 right-4 z-40"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[--primary] shadow-lg shadow-[--primary]/30">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {dueCount} card{dueCount !== 1 ? 's' : ''} due for review
              </p>
              <p className="text-white/70 text-xs">Time to reinforce your memory</p>
            </div>
            <Button
              onClick={onStartReview}
              size="sm"
              className="bg-white text-[--primary] hover:bg-white/90 font-semibold shrink-0"
            >
              Review
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
