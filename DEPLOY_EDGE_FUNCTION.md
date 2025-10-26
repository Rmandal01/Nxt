# Deploy Edge Function to Supabase

## 🚨 IMPORTANT: Deploy the Updated AI Judge Function

The judging system uses a **Supabase Edge Function** that needs to be deployed with your Gemini API key.

## Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Get YOUR_PROJECT_REF from your Supabase project URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`)

## Deploy Steps

### Step 1: Set the Gemini API Key Secret

```bash
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

### Step 2: Deploy the Edge Function

```bash
supabase functions deploy ai-judge
```

This will deploy the updated `supabase/functions/ai-judge/index.ts` file that includes:
- Real AI judging with Gemini
- 4 criteria scoring (Creativity, Effectiveness, Clarity, Originality)
- Detailed feedback for each participant
- Automatic score saving to `participant_scores` table

### Step 3: Verify Deployment

After deployment, the output should show:
```
Deployed Function ai-judge on project YOUR_PROJECT_REF
...
```

## Testing

1. Start a new game in your app
2. Submit prompts from multiple participants
3. Wait for all participants to submit
4. The Edge Function will automatically run
5. Check the results page - you should see:
   - Individual criteria scores (0-10 each)
   - Progress bars with colors
   - Detailed AI feedback
   - Total score out of 40 points
   - NO MORE "randomly selected" message!

## Troubleshooting

If judging fails, check the Edge Function logs:

```bash
supabase functions logs ai-judge
```

Common issues:
- **GEMINI_API_KEY not set**: Run Step 1 again
- **Invalid API key**: Verify your key at https://aistudio.google.com
- **404 errors**: Make sure you deployed after pulling the latest code

## Alternative: Manual Deployment via Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Select `ai-judge` function
3. Upload the file from `supabase/functions/ai-judge/index.ts`
4. Go to Settings → Secrets
5. Add secret: `GEMINI_API_KEY` with your key
6. Deploy the function

---

After deployment, **start a new game** to see the full judging criteria system in action! 🎉
