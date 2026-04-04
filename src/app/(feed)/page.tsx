import { getFeedItems, getAllSources, getItemsDueForReview } from '@/lib/feed-queries'
import { FeedPageClient } from './FeedPageClient'

export default async function FeedPage() {
  const [sources, dueItems] = await Promise.all([
    getAllSources(),
    getItemsDueForReview(),
  ])

  // Load cards from the most recently added source.
  // Future work: merge cards from all sources with unified ordering.
  const items = sources.length > 0 ? await getFeedItems(sources[0].id) : []

  return (
    <FeedPageClient
      initialItems={items}
      dueCount={dueItems.length}
    />
  )
}
