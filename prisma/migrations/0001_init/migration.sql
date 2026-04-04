-- Migration: 0001_init
-- Creates content_sources and feed_items tables with all constraints

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "SourceType" AS ENUM ('TEXT', 'URL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SourceStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "VisualType" AS ENUM ('QUOTE', 'CODE', 'DIAGRAM', 'STAT', 'TIP');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "content_sources" (
  "id"           TEXT         NOT NULL,
  "user_id"      TEXT,
  "title"        TEXT         NOT NULL,
  "source_type"  "SourceType" NOT NULL,
  "raw_content"  TEXT         NOT NULL,
  "source_url"   TEXT,
  "status"       "SourceStatus" NOT NULL DEFAULT 'PENDING',
  "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "content_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feed_items" (
  "id"               TEXT         NOT NULL,
  "content_source_id" TEXT        NOT NULL,
  "hook"             TEXT         NOT NULL,
  "body"             TEXT         NOT NULL,
  "visual_type"      "VisualType" NOT NULL,
  "visual_code"      TEXT,
  "order_index"      INTEGER      NOT NULL,
  "mastery_level"    INTEGER      NOT NULL DEFAULT 0,
  "next_review_date" TIMESTAMPTZ,
  "last_reviewed_at" TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "feed_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feed_items_content_source_id_fkey"
    FOREIGN KEY ("content_source_id")
    REFERENCES "content_sources"("id")
    ON DELETE CASCADE,
  CONSTRAINT "feed_items_mastery_level_check"
    CHECK ("mastery_level" BETWEEN 0 AND 5),
  CONSTRAINT "feed_items_hook_length_check"
    CHECK (char_length("hook") <= 120),
  CONSTRAINT "feed_items_body_length_check"
    CHECK (char_length("body") <= 280),
  CONSTRAINT "feed_items_order_index_check"
    CHECK ("order_index" >= 0)
);
