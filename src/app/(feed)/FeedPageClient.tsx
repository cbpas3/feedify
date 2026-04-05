'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Feed } from '@/components/feed/Feed'
import { TopBar } from '@/components/nav/TopBar'
import { SourceInput } from '@/components/input/SourceInput'
import { ModelLoadingOverlay } from '@/components/overlay/ModelLoadingOverlay'
import { useInference } from '@/hooks/useInference'
import { createSource, saveFeedItems, updateMastery } from '@/lib/actions'
import type { FeedItem } from '@/types/index'

interface FeedPageClientProps {
  initialItems: FeedItem[]
  dueCount: number
}

export function FeedPageClient({ initialItems, dueCount }: FeedPageClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [sourceInputOpen, setSourceInputOpen] = useState(false)

  // Sync state when server component re-renders with fresh data (e.g. after router.refresh())
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])
  const inference = useInference()

  const handleMasteryUpdate = useCallback(
    async (id: string, delta: 1 | -1) => {
      // Optimistic update so the UI responds immediately
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, masteryLevel: Math.max(0, Math.min(5, item.masteryLevel + delta)) }
            : item
        )
      )
      // Persist to server in the background
      await updateMastery(id, delta)
    },
    []
  )

  const handleSourceSubmit = useCallback(
    async (data: { title: string; content: string; type: 'TEXT' | 'URL' }) => {
      // 1. Create content source record
      const sourceResult = await createSource({
        title: data.title,
        sourceType: data.type as import('@/types/index').SourceType,
        rawContent: data.type === 'TEXT' ? data.content : undefined,
        sourceUrl: data.type === 'URL' ? data.content : undefined,
      })

      if ('error' in sourceResult) {
        console.error('Failed to create source:', sourceResult.error)
        return
      }

      const sourceId = sourceResult.id

      // 2. Run local AI inference (model loads on first call)
      const rawText =
        data.type === 'TEXT'
          ? data.content
          : `Fetch and process content from: ${data.content}`

      const inferredItems = await inference.run(rawText, sourceId)

      if (!inferredItems || inferredItems.length === 0) {
        console.error('Inference produced no items')
        return
      }

      // 3. Persist feed items to the database
      const saveResult = await saveFeedItems(sourceId, inferredItems)
      if ('error' in saveResult) {
        console.error('Failed to save feed items:', saveResult.error)
        return
      }

      // 4. Close modal, reset inference state, and re-fetch server data
      setSourceInputOpen(false)
      inference.reset()
      router.refresh()
    },
    [inference, router]
  )

  // Derive processing status message from inference state
  const processingStatus = (() => {
    switch (inference.status) {
      case 'loading-model':
        return inference.isCached
          ? 'Initializing AI model from cache...'
          : 'Downloading AI model (one-time setup)...'
      case 'model-ready':
        return 'AI model ready — starting inference...'
      case 'inferring':
        return 'Generating your learning feed...'
      case 'error':
        return `Error: ${inference.error ?? 'Something went wrong'}`
      default:
        return 'Processing...'
    }
  })()

  const isProcessing = (
    inference.status === 'loading-model' ||
    inference.status === 'model-ready' ||
    inference.status === 'inferring'
  )

  // Show the full-screen overlay only during model download and only when the
  // modal is not already open (the modal shows inline progress otherwise).
  const showOverlay = inference.status === 'loading-model' && !sourceInputOpen

  // Progress value forwarded to SourceInput:
  // - downloading: 0–100 from modelProgress
  // - generating: 0–99 from token-driven inferenceProgress
  const processingProgress =
    inference.status === 'loading-model'
      ? inference.modelProgress
      : inference.status === 'inferring'
        ? inference.inferenceProgress
        : 0

  return (
    <div className="app-shell">
      <TopBar cardCount={items.length} onAddContent={() => setSourceInputOpen(true)} />

      <Feed
        items={items}
        onMasteryUpdate={handleMasteryUpdate}
        onAddContent={() => setSourceInputOpen(true)}
        dueCount={dueCount}
        onStartReview={() => {
          // TODO: filter feed to review queue
        }}
      />

      <SourceInput
        open={sourceInputOpen}
        onOpenChange={setSourceInputOpen}
        onSubmit={handleSourceSubmit}
        isProcessing={isProcessing}
        processingProgress={processingProgress}
        processingStatus={processingStatus}
      />

      <ModelLoadingOverlay
        visible={showOverlay}
        progress={inference.modelProgress}
        isCached={inference.isCached}
      />
    </div>
  )
}
