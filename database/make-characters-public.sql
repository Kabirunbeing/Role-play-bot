-- Quick Scripts to Make Pre-Existing Characters Public
-- Choose ONE of these options and run it in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════
-- OPTION 1: Make ALL your characters public (recommended for testing)
-- ═══════════════════════════════════════════════════════════
UPDATE characters SET is_public = true;

-- Then verify:
SELECT COUNT(*) as public_character_count FROM characters WHERE is_public = true;


-- ═══════════════════════════════════════════════════════════
-- OPTION 2: Make only your 5 most recent characters public
-- ═══════════════════════════════════════════════════════════
-- UPDATE characters SET is_public = true 
-- WHERE id IN (SELECT id FROM characters ORDER BY created_at DESC LIMIT 5);


-- ═══════════════════════════════════════════════════════════
-- OPTION 3: Make specific characters public by name
-- ═══════════════════════════════════════════════════════════
-- UPDATE characters SET is_public = true 
-- WHERE name IN ('Naruto', 'Sakura', 'Sasuke');


-- ═══════════════════════════════════════════════════════════
-- OPTION 4: Make characters public by specific IDs
-- ═══════════════════════════════════════════════════════════
-- UPDATE characters SET is_public = true 
-- WHERE id IN ('uuid-1', 'uuid-2', 'uuid-3');


-- ═══════════════════════════════════════════════════════════
-- BONUS: View all your characters to see which ones to make public
-- ═══════════════════════════════════════════════════════════
-- SELECT id, name, personality, is_public, created_at 
-- FROM characters 
-- ORDER BY created_at DESC;


-- ═══════════════════════════════════════════════════════════
-- BONUS: Add some test likes (optional - for testing the like feature)
-- Replace 'your-user-id' and 'character-id' with real values
-- ═══════════════════════════════════════════════════════════
-- INSERT INTO character_likes (character_id, user_id)
-- VALUES 
--   ('character-id-1', 'your-user-id'),
--   ('character-id-2', 'your-user-id'),
--   ('character-id-3', 'your-user-id')
-- ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- REVERT: Make all characters private again (if needed)
-- ═══════════════════════════════════════════════════════════
-- UPDATE characters SET is_public = false;
