'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, FileText, Link, Sparkles, X } from 'lucide-react'
import { DragDropZone } from './DragDropZone'
import { cn } from '@/lib/utils'

type Tab = 'text' | 'url'

interface SourceInputProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; content: string; type: 'TEXT' | 'URL' }) => void
  isProcessing?: boolean
  processingProgress?: number
  processingStatus?: string
}

const MAX_TEXT_LENGTH = 100_000

export function SourceInput({
  open,
  onOpenChange,
  onSubmit,
  isProcessing = false,
  processingProgress = 0,
  processingStatus = 'Initializing AI model…',
}: SourceInputProps) {
  const [tab, setTab] = useState<Tab>('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onOpenChange(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, isProcessing, onOpenChange])

  const handleFileDrop = useCallback((content: string) => {
    setText(content.slice(0, MAX_TEXT_LENGTH))
  }, [])

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit({
        title: title.trim() || 'Untitled — ' + new Date().toLocaleDateString(),
        content: text.trim(),
        type: 'TEXT',
      })
    }
  }, [text, title, onSubmit])

  const canSubmit = !isProcessing && text.trim().length > 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 z-40"
            style={{ background: 'oklch(0% 0 0 / 0.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => !isProcessing && onOpenChange(false)}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 42, mass: 0.75 }}
            className="absolute bottom-0 left-0 right-0 z-50"
            style={{ maxHeight: '92%' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2.5">
              <div className="w-9 h-1 rounded-full" style={{ background: 'oklch(35% 0.010 260)' }} />
            </div>

            {/* Sheet card */}
            <div
              className="flex flex-col overflow-hidden"
              style={{
                borderRadius: '20px 20px 0 0',
                border: '1px solid oklch(23% 0.012 260)',
                borderBottom: 'none',
                background: 'oklch(12.5% 0.006 260)',
                maxHeight: 'calc(92dvh - 32px)',
              }}
            >
              <div
                className="flex items-center justify-between shrink-0"
                style={{ 
                  borderBottom: '1px solid oklch(18% 0.008 260)',
                  paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem' 
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" style={{ color: 'oklch(74% 0.17 68)' }} />
                  <span
                    className="font-semibold text-base"
                    style={{
                      fontFamily: 'var(--font-playfair, "Playfair Display"), Georgia, serif',
                      color: 'oklch(93% 0.010 80)',
                    }}
                  >
                    Add Content
                  </span>
                </div>
                {!isProcessing && (
                  <button
                    onClick={() => onOpenChange(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150"
                    style={{ color: 'oklch(45% 0.010 260)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'oklch(75% 0.010 80)'; (e.currentTarget as HTMLButtonElement).style.background = 'oklch(20% 0.008 260)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'oklch(45% 0.010 260)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="space-y-5" style={{ padding: '1.25rem' }}>

                  {/* Title */}
                  <div className="space-y-2">
                    <label
                      className="text-[11px] font-semibold tracking-widest uppercase"
                      style={{ color: 'oklch(45% 0.010 260)' }}
                    >
                      Title <span className="font-normal normal-case tracking-normal" style={{ color: 'oklch(35% 0.010 260)' }}>(optional)</span>
                    </label>
                    <input
                      className="w-full h-10 rounded-xl text-sm outline-none transition-all duration-150"
                      style={{
                        paddingLeft: '0.875rem', paddingRight: '0.875rem',
                        border: '1px solid oklch(23% 0.012 260)',
                        background: 'oklch(17% 0.008 260)',
                        color: 'oklch(93% 0.010 80)',
                      }}
                      placeholder="e.g. TypeScript Best Practices"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      disabled={isProcessing}
                      onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'oklch(74% 0.17 68 / 0.60)' }}
                      onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'oklch(23% 0.012 260)' }}
                    />
                  </div>

                  {/* Input area */}
                  <DragDropZone onFileDrop={handleFileDrop}>
                    <textarea
                      className="w-full rounded-xl text-sm leading-relaxed outline-none resize-none transition-all duration-150"
                      style={{
                        padding: '0.75rem 0.875rem',
                        minHeight: '130px',
                        maxHeight: '190px',
                        border: '1px solid oklch(23% 0.012 260)',
                        background: 'oklch(17% 0.008 260)',
                        color: 'oklch(88% 0.010 80)',
                      }}
                      placeholder="Paste your article, notes, or any long-form text here… or drag & drop a .txt file"
                      value={text}
                      onChange={e => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                      disabled={isProcessing}
                      onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'oklch(74% 0.17 68 / 0.60)' }}
                      onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'oklch(23% 0.012 260)' }}
                    />
                    <div className="flex justify-between mt-1.5" style={{ paddingLeft: '0.125rem', paddingRight: '0.125rem' }}>
                      <span className="text-[11px]" style={{ color: 'oklch(38% 0.010 260)' }}>
                        Drag & drop .txt or .md
                      </span>
                      <span
                        className="text-[11px] tabular-nums"
                        style={{
                          color: text.length > MAX_TEXT_LENGTH * 0.9
                            ? 'oklch(74% 0.17 68)'
                            : 'oklch(38% 0.010 260)',
                        }}
                      >
                        {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
                      </span>
                    </div>
                  </DragDropZone>

                  {/* Processing status */}
                  {isProcessing && (
                    <div
                      className="space-y-3 rounded-xl"
                      style={{
                        padding: '0.875rem 1rem',
                        border: '1px solid oklch(74% 0.17 68 / 0.20)',
                        background: 'oklch(74% 0.17 68 / 0.05)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Loader2
                          className="w-3.5 h-3.5 animate-spin shrink-0"
                          style={{ color: 'oklch(74% 0.17 68)' }}
                        />
                        <p className="text-sm leading-snug" style={{ color: 'oklch(82% 0.010 80)' }}>
                          {processingStatus}
                        </p>
                      </div>
                      {processingProgress > 0 && (
                        <div
                          className="h-0.5 w-full rounded-full overflow-hidden"
                          style={{ background: 'oklch(23% 0.012 260)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                              width: `${Math.min(100, processingProgress)}%`,
                              background: 'oklch(74% 0.17 68)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky footer */}
              <div
                className="shrink-0"
                style={{ 
                  borderTop: '1px solid oklch(18% 0.008 260)', background: 'oklch(12.5% 0.006 260)',
                  paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '1rem', paddingBottom: '1rem'
                }}
              >
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
                  style={canSubmit ? {
                    background: 'oklch(74% 0.17 68)',
                    color: 'oklch(14% 0.010 68)',
                  } : {
                    background: 'oklch(20% 0.008 260)',
                    color: 'oklch(38% 0.010 260)',
                    cursor: 'not-allowed',
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating feed…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Feed
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
