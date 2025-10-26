# Database Migration Instructions

## 🚨 IMPORTANT: Run This Migration to Enable Judging Criteria

Your judging system is already coded and ready, but the database tables don't exist yet!

### Steps to Enable Full Judging Criteria:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the Migration SQL**
   - Open the file: `supabase/migrations/add_judging_criteria.sql`
   - Copy ALL the SQL code (lines 1-52)

4. **Run the Migration**
   - Paste the SQL into the editor
   - Click "Run" or press Ctrl+Enter
   - You should see "Success. No rows returned"

5. **Verify**
   - Go to "Table Editor" in the left sidebar
   - You should now see a new table called `participant_scores`

### What This Migration Does:

✅ Creates `participant_scores` table to store:
   - Creativity score (0-10)
   - Effectiveness score (0-10)
   - Clarity score (0-10)
   - Originality score (0-10)
   - Total score (0-40)
   - Individual feedback

✅ Creates database functions:
   - `increment_wins(user_id)` - Updates winner's win count
   - `increment_losses(user_id)` - Updates loser's loss count

✅ Sets up security policies and indexes

✅ Enables real-time subscriptions

### After Running:

Once the migration is complete, your judging system will:
- Show beautiful score breakdowns with progress bars
- Display individual criteria scores for each participant
- Provide personalized AI feedback
- Show color-coded performance indicators (green/yellow/orange/red)

**NO CODE CHANGES NEEDED** - just run the migration and refresh your app!
