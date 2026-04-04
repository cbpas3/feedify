-- Migration: 0003_rls
-- Supabase Row Level Security policies

ALTER TABLE "content_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feed_items" ENABLE ROW LEVEL SECURITY;

-- Allow anonymous (unauthenticated) access for MVP
-- In production, replace with auth.uid() = user_id checks

CREATE POLICY IF NOT EXISTS "content_sources_anon_select"
  ON "content_sources" FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "content_sources_anon_insert"
  ON "content_sources" FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "content_sources_anon_update"
  ON "content_sources" FOR UPDATE
  USING (true);

CREATE POLICY IF NOT EXISTS "feed_items_anon_select"
  ON "feed_items" FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "feed_items_anon_insert"
  ON "feed_items" FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "feed_items_anon_update"
  ON "feed_items" FOR UPDATE
  USING (true);
