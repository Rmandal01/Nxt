-- Copy this file and paste it into your Supabase SQL Editor.
-- Make sure to replace your function URL with the one in Supabase, <your-project-id> with your actual project ID, and replace <your-anon-key> with your actual anon key.

-- 1. Enable the pg_net extension to allow Postgres to make HTTP requests
create extension if not exists pg_net with schema extensions;

-- 2. Create the "smart" function that checks if the game is over
create or replace function public.handle_submission_and_check_completion()
returns trigger as $$
declare
  room_status text;
  total_participants int;
  submitted_participants int;
  edge_function_url text := 'https://<your-project-id>.supabase.co/functions/v1/ai-judge'; -- ⚠️ Paste your function URL here
begin
  -- Get the current status of the room
  select status into room_status
  from public.game_rooms
  where id = new.room_id;

  -- Only proceed if the game is currently 'playing'
  if room_status = 'playing' then
    -- Count total participants in the room
    select count(*) into total_participants
    from public.game_participants
    where room_id = new.room_id;

    -- Count participants who have submitted a prompt
    select count(prompt) into submitted_participants
    from public.game_participants
    where room_id = new.room_id;

    -- Check if everyone has submitted
    if total_participants = submitted_participants then
      -- 1. Update status to 'judging' to prevent this from running again
      update public.game_rooms
      set status = 'judging'
      where id = new.room_id;

      -- 2. Call the Edge Function to start the AI judging
      perform net.http_post(
        url := edge_function_url,
        body := jsonb_build_object('room_id', new.room_id),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || '<your-anon-key>' -- ⚠️ Paste your anon key
        )
      );
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create the trigger
-- This attaches the function to the `game_participants` table
drop trigger if exists on_prompt_submit on public.game_participants;
create trigger on_prompt_submit
  after update of prompt on public.game_participants -- Only fires when 'prompt' is updated
  for each row
  when (new.prompt is not null and old.prompt is null) -- Only fires the *first* time
  execute procedure public.handle_submission_and_check_completion();
