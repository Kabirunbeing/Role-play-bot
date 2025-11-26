-- Gallery Feature Database Setup
-- Run this SQL in your Supabase SQL Editor

-- 1. Add is_public column to characters table (if it doesn't exist)
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 2. Create character_likes table for the like/favorite system
CREATE TABLE IF NOT EXISTS character_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(character_id, user_id)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_character_likes_character_id ON character_likes(character_id);
CREATE INDEX IF NOT EXISTS idx_character_likes_user_id ON character_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_is_public ON characters(is_public);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE character_likes ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for character_likes

-- Allow users to view all likes (for counting)
CREATE POLICY "Allow users to view all character likes" 
ON character_likes FOR SELECT 
USING (true);

-- Allow users to insert their own likes
CREATE POLICY "Allow users to like characters" 
ON character_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Allow users to unlike characters" 
ON character_likes FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Update characters table RLS to allow viewing public characters
-- First, let's allow everyone to read public characters
DROP POLICY IF EXISTS "Allow users to view public characters" ON characters;
CREATE POLICY "Allow users to view public characters" 
ON characters FOR SELECT 
USING (is_public = true OR user_id = auth.uid());

-- 7. Optional: Function to get popular characters (for future use)
CREATE OR REPLACE FUNCTION get_character_like_count(character_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM character_likes
  WHERE character_id = character_uuid;
$$ LANGUAGE SQL STABLE;

-- 8. Make some existing characters public for testing (optional - run this to populate gallery)
-- UPDATE characters SET is_public = true WHERE created_at > NOW() - INTERVAL '30 days';

-- Success message
SELECT 'Gallery feature database setup completed successfully! 🎉' as message;
