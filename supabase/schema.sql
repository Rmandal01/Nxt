-- Create profiles table (without auth reference)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_rooms table
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  host_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, countdown, playing, finished
  max_players INTEGER DEFAULT 2,
  countdown_duration INTEGER DEFAULT 60, -- seconds for prompt submission
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
  player1_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  player2_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  player1_score INTEGER,
  player2_score INTEGER,
  judge_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX idx_game_rooms_room_code ON game_rooms(room_code);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_participants_room_id ON game_participants(room_id);
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_game_results_room_id ON game_results(room_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_results;
