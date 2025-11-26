-- Badges & Achievements System Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create user_badges table to track unlocked badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for user_badges

-- Allow users to view all badges (for leaderboards, etc.)
CREATE POLICY "Allow users to view all badges" 
ON user_badges FOR SELECT 
USING (true);

-- Allow users to insert their own badges (system will handle this)
CREATE POLICY "Allow users to unlock their own badges" 
ON user_badges FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Create a function to check and unlock badges automatically
CREATE OR REPLACE FUNCTION check_and_unlock_badge(
  p_user_id UUID,
  p_badge_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  badge_exists BOOLEAN;
BEGIN
  -- Check if badge already exists
  SELECT EXISTS(
    SELECT 1 FROM user_badges 
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  ) INTO badge_exists;
  
  -- If badge doesn't exist, insert it
  IF NOT badge_exists THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, p_badge_id);
    RETURN true; -- Badge unlocked
  END IF;
  
  RETURN false; -- Badge already unlocked
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a function to get user badge count
CREATE OR REPLACE FUNCTION get_user_badge_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM user_badges
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- 7. Create a function to get character message count
-- NOTE: Commented out until messages table is created
-- Uncomment this when you have a messages table
/*
CREATE OR REPLACE FUNCTION get_character_message_count(p_character_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM messages
  WHERE character_id = p_character_id;
$$ LANGUAGE SQL STABLE;
*/

-- Success message
SELECT 'Badges & Achievements system setup completed successfully! 🏆' as message;
