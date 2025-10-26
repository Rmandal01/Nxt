-- Create profiles table (without auth reference)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_rooms table
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  host_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, countdown, playing, finished
  topic TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Create game_participants table
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  is_ready BOOLEAN DEFAULT FALSE,
  prompt TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Create game_results table
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  winner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  judge_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participant_scores table for individual criteria scores
CREATE TABLE participant_scores (
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (allow all operations without auth)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE
  USING (true);

-- RLS Policies for game_rooms (allow all operations without auth)
CREATE POLICY "Anyone can view game rooms"
  ON game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create game rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update game rooms"
  ON game_rooms FOR UPDATE
  USING (true);

-- RLS Policies for game_participants (allow all operations without auth)
CREATE POLICY "Anyone can view participants"
  ON game_participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert participants"
  ON game_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
  ON game_participants FOR UPDATE
  USING (true);

-- RLS Policies for game_results (allow all operations without auth)
CREATE POLICY "Anyone can view results"
  ON game_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert results"
  ON game_results FOR INSERT
  WITH CHECK (true);

-- RLS Policies for participant_scores (allow all operations without auth)
CREATE POLICY "Anyone can view scores"
  ON participant_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert scores"
  ON participant_scores FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_game_rooms_room_code ON game_rooms(room_code);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_participants_room_id ON game_participants(room_id);
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_game_results_room_id ON game_results(room_id);
CREATE INDEX idx_participant_scores_result_id ON participant_scores(result_id);
CREATE INDEX idx_participant_scores_participant_id ON participant_scores(participant_id);

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

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_results;
ALTER PUBLICATION supabase_realtime ADD TABLE participant_scores;
