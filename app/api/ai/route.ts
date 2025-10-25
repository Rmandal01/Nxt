import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages;

    console.log('Received messages:', messages);
    console.log('API Key available:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    // Returns a StreamTextResult
    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      system: `You are a helpful AI assistant. Execute the user's prompts and provide helpful, creative, and engaging responses. Just respond naturally to whatever the user asks - don't give feedback on the prompt itself, just answer it.`,
      messages: messages,
    });

    // But we need to convert that into a stream response object bc we're doing streaming and not just one generation
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
