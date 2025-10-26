import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages;

    // Get model from request body, headers, or default
    const selectedModelId = body.model ||
                           request.headers.get('x-model-id') ||
                           "gemini-2.0-flash-exp";

    // Map model IDs to actual model instances
    let model;
    switch (selectedModelId) {
      // Google Gemini models
      case "gemini-2.0-flash-exp":
        model = google("gemini-2.0-flash-exp");
        break;
      case "gemini-1.5-pro":
        model = google("gemini-1.5-pro");
        break;
      case "gemini-1.5-flash":
        model = google("gemini-1.5-flash");
        break;

      // Anthropic Claude models
      case "claude-3-5-sonnet-20241022":
        model = anthropic("claude-3-5-sonnet-20241022");
        break;
      case "claude-3-5-haiku-20241022":
        model = anthropic("claude-3-5-haiku-20241022");
        break;
      case "claude-3-opus-20240229":
        model = anthropic("claude-3-opus-20240229");
        break;

      // OpenAI models
      case "gpt-4o":
        model = openai("gpt-4o");
        break;
      case "gpt-4o-mini":
        model = openai("gpt-4o-mini");
        break;
      case "gpt-4-turbo":
        model = openai("gpt-4-turbo");
        break;
      case "gpt-3.5-turbo":
        model = openai("gpt-3.5-turbo");
        break;

      default:
        console.log(`Unknown model: ${selectedModelId}, falling back to Gemini 2.0 Flash`);
        model = google("gemini-2.0-flash-exp");
    }

    // Returns a StreamTextResult
    const result = streamText({
      model: model,
      system: `You are a helpful AI assistant. Execute the user's prompts and provide helpful, creative, and engaging responses. Just respond naturally to whatever the user asks - don't give feedback on the prompt itself, just answer it.`,
      messages: convertToModelMessages(messages), // Convert UIMessage[] to ModelMessage[] (this one doesn't include metadata like timestamps, it's just the messages),
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
