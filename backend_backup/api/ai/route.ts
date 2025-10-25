import { google } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export async function POST(request: Request) {
  // JSON structure has a key called messages and the value of the key is an array of UIMessage objects
  // UIMessage is a type for AI messages designed for the UI
  // So we're destructuring it
  // And then the thing after the colon is to define the type
  const { messages }: { messages: UIMessage[] } = await request.json();

  // Returns a StreamTextResult
  const result = streamText({
    model: google("gemini-1.5-flash"),
    system: `You are a helpful AI assistant. Execute the user's prompts and provide helpful, creative, and engaging responses. Just respond naturally to whatever the user asks - don't give feedback on the prompt itself, just answer it.`,
    messages: convertToModelMessages(messages), // Convert UIMessage[] to ModelMessage[] (this one doesn't include metadata like timestamps, it's just the messages)
  });

  // But we need to convert that into a stream response object bc we're doing streaming and not just one generation
  return result.toUIMessageStreamResponse();
}
