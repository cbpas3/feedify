-- Migration: 0002_indexes
-- Performance indexes for common query patterns

-- Feed items by source (most common query: load all cards for a source)
CREATE INDEX IF NOT EXISTS "idx_feed_items_source_id"
  ON "feed_items"("content_source_id");

-- Feed items ordered within a source (for feed display)
CREATE INDEX IF NOT EXISTS "idx_feed_items_order"
  ON "feed_items"("content_source_id", "order_index");

-- SRS review queue: items due for review (partial index, excludes NULLs)
CREATE INDEX IF NOT EXISTS "idx_feed_items_next_review"
  ON "feed_items"("next_review_date")
  WHERE "next_review_date" IS NOT NULL;

-- Sources by user (for listing a user's sources)
CREATE INDEX IF NOT EXISTS "idx_content_sources_user"
  ON "content_sources"("user_id")
  WHERE "user_id" IS NOT NULL;

-- Sources by status (for background processing queue)
CREATE INDEX IF NOT EXISTS "idx_content_sources_status"
  ON "content_sources"("status");
