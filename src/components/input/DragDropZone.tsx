'use client'

import { useState, useCallback } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DragDropZoneProps {
  onFileDrop: (content: string) => void
  children: React.ReactNode
  className?: string
}

export function DragDropZone({ onFileDrop, children, className }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (!file) return
      if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) onFileDrop(content)
      }
      reader.readAsText(file)
    },
    [onFileDrop]
  )

  return (
    <div
      className={cn('relative', className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[--primary] bg-[--primary]/10 backdrop-blur-sm"
          >
            <Upload className="w-8 h-8 text-[--primary]" />
            <p className="text-sm font-medium text-[--primary]">Drop your text file here</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
