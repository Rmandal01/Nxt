-- Enable Row Level Security on participant_scores table
ALTER TABLE participant_scores ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all participant scores
-- (Players need to see scores after battles are judged)
CREATE POLICY "Anyone can view participant scores"
ON participant_scores
FOR SELECT
TO authenticated
USING (true);

-- Only allow inserts from service role (judge API)
-- This is handled by the API endpoint, so we don't need an INSERT policy here

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
