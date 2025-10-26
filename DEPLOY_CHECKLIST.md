# Deployment Checklist - Get AI Judging Working

## Current Status
✅ Code updated - Edge Function has real AI judging
✅ Database migration ready
✅ UI displays old results gracefully
❌ **Edge Function NOT deployed yet** (still using old mock version!)

---

## 🚨 YOU MUST DEPLOY THE EDGE FUNCTION!

Until you deploy, **ALL new games will still show "randomly selected"!**

## Quick Deploy Steps:

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project: `tchgysxsookhehaajjpj`

2. **Navigate to Edge Functions**
   - Click "Edge Functions" in left sidebar
   - Find or create function named `ai-judge`

3. **Upload the New Code**
   - Click "Edit" or "Create new function"
   - Name: `ai-judge`
   - Copy **ALL** contents from: `d:\Summer Projects\Nxt\supabase\functions\ai-judge\index.ts`
   - Paste into the editor
   - Click "Save" or "Deploy"

4. **Set the API Key Secret**
   - Go to Project Settings → Edge Functions → Secrets
   - Click "Add secret"
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key from https://aistudio.google.com/app/apikey
   - Click "Save"

5. **Deploy the Function**
   - Go back to Edge Functions → `ai-judge`
   - Click "Deploy" button

### Option 2: Via Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref tchgysxsookhehaajjpj

# Set the Gemini API key
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here

# Deploy the function
supabase functions deploy ai-judge

# Verify deployment
supabase functions list
```

---

## After Deployment:

### Clean Up Old Data (Optional)
Run this in Supabase SQL Editor:
```sql
DELETE FROM participant_scores;
DELETE FROM game_results;
```

### Test the New System

1. **Create a NEW room** (don't reuse old ones!)
2. **Join with 2+ players**
3. **Submit prompts**
4. **Wait for judging** (should take 5-10 seconds)
5. **Check results** - You should see:
   - ✅ Real AI reasoning (not "randomly selected")
   - ✅ Individual criteria scores (Creativity, Effectiveness, Clarity, Originality)
   - ✅ Progress bars with colors
   - ✅ Detailed feedback for each participant
   - ✅ Total score out of 40 points

---

## Troubleshooting

### Still seeing "randomly selected"?
- Check: Did you actually click "Deploy" in Supabase?
- Check: Are you testing with a NEW game or viewing old results?
- Check: Is `GEMINI_API_KEY` set in Edge Function secrets?

### Check Edge Function Logs
In Supabase Dashboard:
- Edge Functions → `ai-judge` → Logs tab
- Look for errors or "GEMINI_API_KEY not found"

### Verify Deployment
The logs should show:
```
Gemini API response: {...}
Successfully parsed AI decision: {...}
Successfully inserted participant scores
```

---

## You're Almost There! 🎉

Everything is coded and ready. You just need to **deploy the Edge Function** and the full judging criteria system will work!

**Deploy now and start a new game to see it in action!** 🚀
