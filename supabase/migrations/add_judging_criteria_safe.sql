-- Migration: Add judging criteria system (Safe version)
-- This version safely creates everything even if some parts exist

-- Create participant_scores table for individual criteria scores
CREATE TABLE IF NOT EXISTS participant_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID REFERENCES game_results(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES game_participants(id) ON DELETE CASCADE,
  creativity_score INTEGER CHECK (creativity_score >= 0 AND creativity_score <= 10),
  effectiveness_score INTEGER CHECK (effectiveness_score >= 0 AND effectiveness_score <= 10),
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 10),
  originality_score INTEGER CHECK (originality_score >= 0 AND originality_score <= 10),
  total_score INTEGER,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(result_id, participant_id)
);

-- Enable Row Level Security (skip if already enabled)
DO $$
BEGIN
  ALTER TABLE participant_scores ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Anyone can view scores" ON participant_scores;
DROP POLICY IF EXISTS "Anyone can insert scores" ON participant_scores;

CREATE POLICY "Anyone can view scores"
  ON participant_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert scores"
  ON participant_scores FOR INSERT
  WITH CHECK (true);

-- Create indexes (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_participant_scores_result_id ON participant_scores(result_id);
CREATE INDEX IF NOT EXISTS idx_participant_scores_participant_id ON participant_scores(participant_id);

-- Create functions for updating win/loss counts
CREATE OR REPLACE FUNCTION increment_wins(user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET wins = wins + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_losses(user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET losses = losses + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime for participant_scores (safe to run multiple times)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE participant_scores;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
