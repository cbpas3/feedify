'use client'

import { useState, useCallback } from 'react'
import { Loader2, FileText, Link, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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
  processingStatus = 'Initializing AI model...',
}: SourceInputProps) {
  const [tab, setTab] = useState<Tab>('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  const handleFileDrop = useCallback((content: string) => {
    setText(content.slice(0, MAX_TEXT_LENGTH))
  }, [])

  const handleSubmit = useCallback(() => {
    if (tab === 'text' && text.trim()) {
      onSubmit({
        title: title.trim() || 'Untitled — ' + new Date().toLocaleDateString(),
        content: text.trim(),
        type: 'TEXT',
      })
    } else if (tab === 'url' && url.trim()) {
      onSubmit({
        title: title.trim() || url,
        content: url.trim(),
        type: 'URL',
      })
    }
  }, [tab, text, url, title, onSubmit])

  const canSubmit =
    !isProcessing &&
    ((tab === 'text' && text.trim().length > 0) ||
      (tab === 'url' && url.trim().length > 0))

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="w-full max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[--primary]" />
            Add Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title input */}
          <div>
            <label className="text-xs text-[--muted-foreground] mb-1.5 block">
              Title (optional)
            </label>
            <Input
              placeholder="e.g. TypeScript Best Practices"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg border border-[--border] p-1 gap-1">
            {(['text', 'url'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                disabled={isProcessing}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                  tab === t
                    ? 'bg-[--primary] text-white'
                    : 'text-[--muted-foreground] hover:text-[--foreground]'
                )}
              >
                {t === 'text' ? <FileText className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                {t === 'text' ? 'Paste Text' : 'Enter URL'}
              </button>
            ))}
          </div>

          {/* Input area */}
          {tab === 'text' ? (
            <DragDropZone onFileDrop={handleFileDrop}>
              <Textarea
                placeholder="Paste your article, notes, or any long-form text here... (or drag & drop a .txt file)"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                className="min-h-[180px] text-sm"
                disabled={isProcessing}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-[--muted-foreground]">
                  Drag & drop .txt or .md files
                </p>
                <p className={cn(
                  'text-xs',
                  text.length > MAX_TEXT_LENGTH * 0.9 ? 'text-amber-400' : 'text-[--muted-foreground]'
                )}>
                  {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
                </p>
              </div>
            </DragDropZone>
          ) : (
            <div>
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isProcessing}
              />
              <p className="text-xs text-[--muted-foreground] mt-1.5">
                The page content will be extracted and processed locally
              </p>
            </div>
          )}

          {/* Processing progress */}
          {isProcessing && (
            <div className="space-y-2 p-3 rounded-lg bg-[--muted] border border-[--border]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[--primary]" />
                <p className="text-sm text-[--foreground]">{processingStatus}</p>
              </div>
              {processingProgress > 0 && (
                <Progress value={processingProgress} className="h-1.5" />
              )}
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Feed...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Feed
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
