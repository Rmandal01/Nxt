import { serve } from "std/server";
import { createClient } from "supabase-js";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// This is your server-side logic
async function callAiJudge(
  prompts: { user_id: string; prompt: string }[]
) {
  const judgingPrompt = `
    You are the judge for a prompt engineering game. Your job is to judge the responses and select the winner based on the following criteria:
    - Creativity
    - Effectiveness
    - Clarity
    - Originality

    Here are the submissions from the players:
    ${prompts.map((p) => `User ID: ${p.user_id}\nResponse: ${p.prompt}`).join("\n")}

    Please respond *only* with a JSON object containing the "winner_id" and "reasoning".
    Example: {"winner_id": "user-abc-123", "reasoning": "This response was the most creative."}
  `;

  // --- 🚀 CALL YOUR AI (e.g., Google's Gemini API) ---
  const { object: aiResponseObject } = await generateObject({
    model: google("gemini-2.0-flash-exp"),
    prompt: judgingPrompt,
    schema: z.object({
      winner_id: z.string().describe("The ID of the winner"),
      reasoning: z.string().describe("The reasoning for the winner selection"),
    }),
  });

  return aiResponseObject;
}

// This is the main serverless function
serve(async (req: Request) => {
  try {
    const { room_id } = await req.json(); // Get the room_id from the SQL trigger
    console.log("Received room_id:", room_id);
    if (!room_id) {
      console.log("ERROR: No room_id provided");
      throw new Error("No room_id provided");
    }

    // Create an admin client to securely interact with the database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get all submissions for the room
    console.log("Fetching participants for room_id:", room_id);
    const { data: participants, error: pError } = await supabaseAdmin
      .from("game_participants")
      .select("user_id, prompt")
      .eq("room_id", room_id)
      .not("prompt", "is", null); // Only get those who submitted

    if (pError) {
      console.log("ERROR: Failed to fetch participants:", pError);
      throw pError;
    }
    if (!participants || participants.length === 0) {
      console.log("ERROR: No participants found for judging. Participants:", participants);
      throw new Error("No participants found for judging.");
    }
    console.log("Found participants:", participants.length);

    // 2. Call the AI judge
    console.log("Calling AI judge with participants:", participants);
    const aiDecision = await callAiJudge(participants);
    if (!aiDecision) {
      console.log("ERROR: AI judge failed to return a valid decision");
      throw new Error("AI judge failed to return a valid decision.");
    }
    console.log("AI decision:", aiDecision);

    // 3. Insert the winner into game_results
    console.log("Inserting winner into game_results:", {
      room_id: room_id,
      winner_id: aiDecision.winner_id,
      judge_reasoning: aiDecision.reasoning,
    });
    const { error: resultError } = await supabaseAdmin
      .from("game_results")
      .insert({
        room_id: room_id,
        winner_id: aiDecision.winner_id,
        judge_reasoning: aiDecision.reasoning,
      });

    if (resultError) {
      console.log("ERROR: Failed to insert game result:", resultError);
      throw resultError;
    }
    console.log("Successfully inserted game result");

    // 5. Mark the game room as finished
    console.log("Marking game room as finished for room_id:", room_id);
    const { error: roomError } = await supabaseAdmin
      .from("game_rooms")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", room_id);
    
    if (roomError) {
      console.log("ERROR: Failed to mark game room as finished:", roomError);
      throw roomError;
    }
    console.log("Successfully marked game room as finished");

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("CAUGHT ERROR in main try-catch:", error);
    if (error instanceof Error) {
      console.log("ERROR: Error instance with message:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("ERROR: Unknown error type:", typeof error, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
