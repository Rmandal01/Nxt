-- Remove the UNIQUE constraint from usernames
-- This allows multiple users to have the same display name
-- User IDs are still unique (TEXT PRIMARY KEY)

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Clean up any test data (optional - uncomment if you want to reset)
-- TRUNCATE TABLE game_results CASCADE;
-- TRUNCATE TABLE game_participants CASCADE;
-- TRUNCATE TABLE game_rooms CASCADE;
-- TRUNCATE TABLE profiles CASCADE;
