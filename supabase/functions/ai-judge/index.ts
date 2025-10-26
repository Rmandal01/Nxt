import { serve } from "std/server";
import { createClient } from "supabase-js";

interface ParticipantScore {
  participant_id: string;
  creativity_score: number;
  effectiveness_score: number;
  clarity_score: number;
  originality_score: number;
  feedback: string;
  total_score: number;
}

interface JudgingResult {
  winner_id: string;
  reasoning: string;
  scores: ParticipantScore[];
}

// This is your server-side logic with proper AI judging
async function callAiJudge(
  prompts: { user_id: string; prompt: string }[],
  topic: string
): Promise<JudgingResult | null> {
  const judgingPrompt = `You are an expert judge for a prompt engineering battle. The battle topic is: "${topic}"

Evaluate each participant's prompt based on these criteria:
1. **Creativity (0-10)**: How creative and imaginative is the prompt?
2. **Effectiveness (0-10)**: How well would this prompt achieve the intended goal?
3. **Clarity (0-10)**: How clear, well-structured, and easy to understand is it?
4. **Originality (0-10)**: How unique and innovative is the approach?

Here are the participants and their prompts:
${prompts.map((p, idx) => `
Participant ${idx + 1} (ID: ${p.user_id}):
Prompt: ${p.prompt || 'No prompt submitted'}
`).join('\n\n')}

Please provide:
1. Individual scores for each participant across all criteria
2. Detailed constructive feedback for each participant (3-4 sentences) that:
   - Explains WHY they received their scores
   - Highlights their strengths
   - Identifies specific areas for improvement
   - For the winner, explain what made their prompt stand out
3. The winner (participant with highest total score)
4. Overall reasoning for selecting the winner that clearly explains which criteria they excelled at

Respond ONLY with a valid JSON object in this exact format:
{
  "winner_id": "user_id_here",
  "reasoning": "overall reasoning here (3-4 sentences)",
  "scores": [
    {
      "participant_id": "user_id_here",
      "creativity_score": 0-10,
      "effectiveness_score": 0-10,
      "clarity_score": 0-10,
      "originality_score": 0-10,
      "feedback": "detailed feedback here"
    }
  ]
}

Be fair, objective, and thorough in your evaluation. The winner should have the highest combined score across all categories.`;

  try {
    // Call Google Gemini API
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("ERROR: GEMINI_API_KEY not found in environment");
      return null;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: judgingPrompt }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
          }
        }),
      }
    );

    const aiData = await response.json();
    console.log("Gemini API response:", JSON.stringify(aiData, null, 2));

    if (!aiData.candidates || !aiData.candidates[0]?.content?.parts?.[0]?.text) {
      console.error("ERROR: Invalid Gemini API response structure");
      return null;
    }

    let aiResponseText = aiData.candidates[0].content.parts[0].text;

    // Clean up response (remove markdown code blocks if present)
    aiResponseText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log("Cleaned AI response:", aiResponseText);

    const parsed = JSON.parse(aiResponseText) as JudgingResult;

    // Calculate total scores
    parsed.scores = parsed.scores.map(score => ({
      ...score,
      total_score: score.creativity_score + score.effectiveness_score +
                   score.clarity_score + score.originality_score
    }));

    console.log("Successfully parsed AI decision:", parsed);
    return parsed;
  } catch (e) {
    console.error("ERROR: Failed to call or parse AI response:", e);
    return null;
  }
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

    // 1. Get room details for topic
    console.log("Fetching room details for room_id:", room_id);
    const { data: room, error: roomFetchError } = await supabaseAdmin
      .from("game_rooms")
      .select("*")
      .eq("id", room_id)
      .single();

    if (roomFetchError || !room) {
      console.log("ERROR: Failed to fetch room:", roomFetchError);
      throw roomFetchError || new Error("Room not found");
    }

    // 2. Get all participants with their full details
    console.log("Fetching participants for room_id:", room_id);
    const { data: participants, error: pError } = await supabaseAdmin
      .from("game_participants")
      .select("id, user_id, prompt")
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

    // 3. Call the AI judge with topic
    console.log("Calling AI judge with participants:", participants);
    const aiDecision = await callAiJudge(
      participants.map((p: any) => ({ user_id: p.user_id, prompt: p.prompt })),
      room.topic || "No topic specified"
    );
    if (!aiDecision) {
      console.log("ERROR: AI judge failed to return a valid decision");
      throw new Error("AI judge failed to return a valid decision.");
    }
    console.log("AI decision:", aiDecision);

    // 4. Insert the winner into game_results
    console.log("Inserting winner into game_results:", {
      room_id: room_id,
      winner_id: aiDecision.winner_id,
      judge_reasoning: aiDecision.reasoning,
    });
    const { data: gameResult, error: resultError } = await supabaseAdmin
      .from("game_results")
      .insert({
        room_id: room_id,
        winner_id: aiDecision.winner_id,
        judge_reasoning: aiDecision.reasoning,
      })
      .select()
      .single();

    if (resultError || !gameResult) {
      console.log("ERROR: Failed to insert game result:", resultError);
      throw resultError;
    }
    console.log("Successfully inserted game result, ID:", gameResult.id);

    // 5. Insert participant scores
    console.log("Inserting participant scores...");
    const participantScoresToInsert = aiDecision.scores.map((score: ParticipantScore) => {
      const participant = participants.find((p: any) => p.user_id === score.participant_id);
      return {
        result_id: gameResult.id,
        participant_id: participant?.id,
        creativity_score: score.creativity_score,
        effectiveness_score: score.effectiveness_score,
        clarity_score: score.clarity_score,
        originality_score: score.originality_score,
        total_score: score.total_score,
        feedback: score.feedback,
      };
    });

    const { error: scoresError } = await supabaseAdmin
      .from("participant_scores")
      .insert(participantScoresToInsert);

    if (scoresError) {
      console.log("ERROR: Failed to insert participant scores:", scoresError);
      // Don't throw - result is still saved
    } else {
      console.log("Successfully inserted participant scores");
    }

    // 6. Update winner/loser counts
    console.log("Updating winner profile...");
    const { error: winError } = await supabaseAdmin.rpc('increment_wins', {
      user_id: aiDecision.winner_id
    });
    if (winError) {
      console.log("WARN: Failed to increment wins:", winError);
    }

    const loserIds = participants
      .filter((p: any) => p.user_id !== aiDecision.winner_id)
      .map((p: any) => p.user_id);

    for (const loserId of loserIds) {
      const { error: lossError } = await supabaseAdmin.rpc('increment_losses', {
        user_id: loserId
      });
      if (lossError) {
        console.log("WARN: Failed to increment losses for", loserId, ":", lossError);
      }
    }
    console.log("Successfully updated participant scores");

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
