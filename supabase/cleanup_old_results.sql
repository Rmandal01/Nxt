-- Cleanup old game results for testing
-- Run this in Supabase SQL Editor to remove old mock judging results

-- WARNING: This will delete ALL game results and scores!
-- Only use for testing/development

BEGIN;

-- Delete all participant scores
DELETE FROM participant_scores;

-- Delete all game results
DELETE FROM game_results;

-- Optional: Reset game rooms to waiting status
-- (Uncomment if you want to reuse existing rooms)
-- UPDATE game_rooms SET status = 'waiting', finished_at = NULL WHERE status = 'finished';

COMMIT;

-- Verify deletion
SELECT COUNT(*) as remaining_results FROM game_results;
SELECT COUNT(*) as remaining_scores FROM participant_scores;
