import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FeedCard } from '@/components/feed/FeedCard'
import type { FeedItem } from '@/types/index'
import { VisualType } from '@/types/index'

const mockItem: FeedItem = {
  id: 'test-id-1',
  contentSourceId: 'source-1',
  hook: 'TypeScript catches bugs before production',
  body: 'Static type checking eliminates entire classes of runtime errors.',
  visualType: VisualType.TIP,
  visualCode: null,
  orderIndex: 0,
  masteryLevel: 2,
  nextReviewDate: null,
  lastReviewedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('FeedCard', () => {
  it('renders the hook text', () => {
    render(
      <FeedCard
        item={mockItem}
        isActive={true}
        onGotIt={vi.fn()}
        onReviewLater={vi.fn()}
      />
    )
    expect(screen.getByText(mockItem.hook)).toBeInTheDocument()
  })

  it('renders the visual type label', () => {
    render(
      <FeedCard item={mockItem} isActive={true} onGotIt={vi.fn()} onReviewLater={vi.fn()} />
    )
    expect(screen.getByText('Tip')).toBeInTheDocument()
  })

  it('calls onGotIt when "Got it!" button is clicked', () => {
    const onGotIt = vi.fn()
    render(
      <FeedCard item={mockItem} isActive={true} onGotIt={onGotIt} onReviewLater={vi.fn()} />
    )
    fireEvent.click(screen.getByText(/got it/i))
    expect(onGotIt).toHaveBeenCalledTimes(1)
  })

  it('calls onReviewLater when "Review Later" button is clicked', () => {
    const onReviewLater = vi.fn()
    render(
      <FeedCard item={mockItem} isActive={true} onGotIt={vi.fn()} onReviewLater={onReviewLater} />
    )
    fireEvent.click(screen.getByText(/review later/i))
    expect(onReviewLater).toHaveBeenCalledTimes(1)
  })

  it('renders 5 mastery dots', () => {
    const { container } = render(
      <FeedCard item={mockItem} isActive={true} onGotIt={vi.fn()} onReviewLater={vi.fn()} />
    )
    // 5 dot divs with rounded-full class
    const dots = container.querySelectorAll('.rounded-full.w-1\\.5.h-1\\.5')
    expect(dots.length).toBe(5)
  })

  it('renders CODE visual with code block', () => {
    const codeItem: FeedItem = {
      ...mockItem,
      visualType: VisualType.CODE,
      visualCode: '```typescript\nconst x = 1\n```',
    }
    render(
      <FeedCard item={codeItem} isActive={true} onGotIt={vi.fn()} onReviewLater={vi.fn()} />
    )
    expect(screen.getByText(/const x = 1/)).toBeInTheDocument()
  })
})
