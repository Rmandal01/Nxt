# Prompt Battle - Real-Time Multiplayer Setup Guide

A real-time multiplayer prompt competition game where two players compete with their prompts and Gemini AI judges the winner.

## Features

- Real-time room-based multiplayer using Supabase Realtime
- Create or join game rooms with unique 6-digit codes
- Waiting room with ready status
- 3-2-1 countdown before battle starts
- 60-second timer for prompt submission
- Gemini AI judges prompts on creativity and quality
- Beautiful results screen with scores and AI reasoning
- Player statistics tracking (wins/losses)

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works!)
- A Google Gemini API key (free tier available)

---

## Step 1: Create Supabase Project

### 1.1 Sign Up and Create Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** and sign up
3. Create a new project:
   - **Name**: `prompt-battle` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Plan**: Free tier is fine
4. Wait 1-2 minutes for setup to complete

### 1.2 Run Database Schema

1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. You should see: "Success. No rows returned"

This creates all tables, security policies, indexes, and enables real-time subscriptions.

### 1.3 Get API Keys

1. Go to **Settings** → **API** in the left sidebar
2. Copy these three values:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon/public key: eyJhbGci...
   service_role key: eyJhbGci... (keep this secret!)
   ```

### 1.4 Enable Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. For easier testing, go to **Authentication** → **Settings**:
   - Disable "Confirm email" (enable later in production)
   - Click **Save**

---

## Step 2: Get Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select **"Create API key in new project"** or choose existing
5. Copy the API key

---

## Step 3: Configure Environment Variables

1. Create `.env.local` file in your project root:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your actual keys, e.g.:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your_service_role_key

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

---
## Step 4: Deploy Edge Function to Supabase
First log in to Supabase through the CLI:
```bash
npx supabase login
```
You should get either a browser link or a URL where you can enter a verification code.

Then deploy the ai-judge function (this is the backend function that will be called when everyone's submitted their prompts). Select the Supabase project that you're using for this repo.
```bash
npx supabase functions deploy ai-judge
```

Then, import the secrets from your .env file onto the server.
```bash
npx supabase secrets set --env-file .env.local
```

Then, copy the contents of the file `supabase/judge_func_example.sql` into the Supabase SQL editor. This is so when everyone's submitted a prompt, it will trigger the edge function. **Make sure to replace <your-project-id> with your actual project ID, and replace <your-anon-key> with your actual anon key.**


## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 7: Test the Game

### Testing Requires Two Players

Since this is a multiplayer game, you need two browser sessions:

#### Browser 1 (Player 1)
1. Open http://localhost:3000 in **Incognito/Private mode**
2. Sign up with email (e.g., `player1@test.com`)
3. Click **"Create New Room"**
4. Copy the 6-digit room code displayed

#### Browser 2 (Player 2)
1. Open http://localhost:3000 in a **different browser or regular mode**
2. Sign up with different email (e.g., `player2@test.com`)
3. Click **"Join Room"**
4. Enter the room code from Player 1

#### Play the Game
1. Both players click **"Ready"**
2. Watch the 3-2-1 countdown
3. Submit your best prompts within 60 seconds
4. Wait for Gemini AI to judge
5. View results with scores and reasoning!

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── judge/route.ts          # Gemini AI judging endpoint
│   │   └── rooms/
│   │       ├── create/route.ts     # Create game room
│   │       ├── join/route.ts       # Join existing room
│   │       ├── ready/route.ts      # Toggle ready status
│   │       └── submit-prompt/route.ts # Submit prompt
│   ├── room/[roomCode]/page.tsx    # Dynamic room page
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Home page
├── components/
│   ├── BattleArena.tsx             # Battle UI with timer
│   ├── Results.tsx                 # Results screen
│   └── RoomLobby.tsx               # Waiting room
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── admin.ts                # Admin client
│   └── types/
│       └── database.types.ts       # TypeScript types
└── supabase/
    └── schema.sql                  # Database schema
```

---

## How It Works

### Game Flow

1. **Room Creation**: Host creates a room → unique 6-digit code generated
2. **Joining**: Other player joins with room code
3. **Lobby**: Both players mark ready → auto-starts when all ready
4. **Countdown**: 3-2-1 countdown animation
5. **Battle**: 60-second timer, both submit prompts
6. **Judging**: Gemini AI evaluates based on:
   - Creativity and originality
   - Clarity and specificity
   - Engagement potential
   - Overall quality
7. **Results**: Scores (0-100), winner declared, AI reasoning shown

### Real-Time Features

The app uses **Supabase Realtime** for:
- Room status updates (waiting → countdown → playing → finished)
- Player ready status
- Prompt submissions
- Results broadcasting

All participants see updates instantly without page refresh!

### Database Tables

- `profiles` - User profiles with username, wins, losses
- `game_rooms` - Active game rooms with status
- `game_participants` - Players in each room
- `game_results` - Battle outcomes with AI reasoning

---

## Customization

### Change Battle Duration

Edit `countdown_duration` in `supabase/schema.sql`:

```sql
countdown_duration INTEGER DEFAULT 60  -- Change to 120 for 2 minutes
```

Then update the room in Supabase dashboard or re-run schema.

### Change Max Players

Currently supports 2 players. To change:

```sql
max_players INTEGER DEFAULT 2  -- Change to 4 for 4 players
```

### Customize AI Judging

Edit the judging prompt in `app/api/judge/route.ts` to change criteria.

---

## Troubleshooting

### "Unauthorized" Errors
- Verify users are signed up and logged in
- Check `.env.local` has correct Supabase keys
- Ensure tables exist in Supabase (run schema.sql)

### Real-time Not Working
- Check browser console for errors
- Verify Realtime is enabled: SQL Editor → run:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
  ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;
  ALTER PUBLICATION supabase_realtime ADD TABLE game_results;
  ```

### Gemini API Errors
- Verify API key in `.env.local`
- Check quota at [https://aistudio.google.com](https://aistudio.google.com)
- Ensure you're using a valid Gemini model

### Database Errors
- Ensure complete schema.sql was run
- Check Row Level Security (RLS) policies are enabled
- Verify foreign key relationships

---

## Next Steps & Ideas

- Add user profiles with avatars
- Implement ELO rating system
- Add match history and leaderboards
- Create tournament brackets
- Add voice chat during battles
- Implement themes/categories for prompts
- Add sound effects and animations
- Mobile app version

---

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

Happy battling! 🎮✨
