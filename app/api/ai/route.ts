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
    system: `You are a prompt improvement AI assistant. Your role is to help users craft better, more creative, and effective prompts.

When a user shares their prompt with you:
1. Analyze the prompt for clarity, creativity, and effectiveness
2. Suggest specific improvements
3. Provide an enhanced version of the prompt
4. Explain why your improvements make the prompt better

Be constructive, creative, and help users understand what makes a great prompt.`,
    messages: convertToModelMessages(messages), // Convert UIMessage[] to ModelMessage[] (this one doesn't include metadata like timestamps, it's just the messages)
  });

  // But we need to convert that into a stream response object bc we're doing streaming and not just one generation
  return result.toUIMessageStreamResponse();
}
