-- Commerce Public Library - Draft/Publish CMS Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This adds a `status` column to all CMS tables for draft/publish workflow.

-- Add status column to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Add status column to announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);

-- Add status column to staff_picks
ALTER TABLE staff_picks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
CREATE INDEX IF NOT EXISTS idx_staff_picks_status ON staff_picks(status);

-- Add status column to closures
ALTER TABLE closures ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

-- Add status column to hours_overrides
ALTER TABLE hours_overrides ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

-- Add status column to page_content
ALTER TABLE page_content ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
CREATE INDEX IF NOT EXISTS idx_page_content_status ON page_content(status);

-- Fix page_content.content column: change from jsonb to text so plain strings (URLs, text) work correctly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'page_content' AND column_name = 'content' AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE page_content ALTER COLUMN content TYPE text USING content::text;
    ALTER TABLE page_content ALTER COLUMN content SET DEFAULT '';
  END IF;
END $$;

-- All existing rows will automatically get status = 'published' (the default)
-- New content created through the AI chat will be inserted with status = 'draft'
