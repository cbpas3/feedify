'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FeedCard } from './FeedCard'
import { FeedCardSkeleton } from './FeedCardSkeleton'
import { EmptyFeedCTA } from './EmptyFeedCTA'
import { ReviewBanner } from './ReviewBanner'
import type { FeedItem } from '@/types/index'
import '@/styles/feed.css'

interface FeedProps {
  items: FeedItem[]
  isLoading?: boolean
  onMasteryUpdate: (id: string, delta: 1 | -1) => void
  onAddContent: () => void
  dueCount?: number
  onStartReview?: () => void
}

export function Feed({
  items,
  isLoading = false,
  onMasteryUpdate,
  onAddContent,
  dueCount = 0,
  onStartReview,
}: FeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // Track which card is currently in the viewport via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    itemRefs.current.forEach((el, index) => {
      if (!el) return
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
              setActiveIndex(index)
            }
          })
        },
        { threshold: 0.6 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [items])

  const handleGotIt = useCallback(
    (id: string) => onMasteryUpdate(id, 1),
    [onMasteryUpdate]
  )

  const handleReviewLater = useCallback(
    (id: string) => onMasteryUpdate(id, -1),
    [onMasteryUpdate]
  )

  if (isLoading) {
    return (
      <div className="feed-container">
        {Array.from({ length: 3 }).map((_, i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="feed-container">
        <EmptyFeedCTA onAddContent={onAddContent} />
      </div>
    )
  }

  return (
    <>
      <div ref={containerRef} className="feed-container">
        {items.map((item, index) => (
          <div
            key={item.id}
            ref={(el) => { itemRefs.current[index] = el }}
            className="feed-item"
          >
            <FeedCard
              item={item}
              isActive={index === activeIndex}
              onGotIt={() => handleGotIt(item.id)}
              onReviewLater={() => handleReviewLater(item.id)}
            />
          </div>
        ))}
      </div>

      {onStartReview && (
        <ReviewBanner dueCount={dueCount} onStartReview={onStartReview} />
      )}
    </>
  )
}
