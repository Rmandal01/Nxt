import { NextRequest, NextResponse } from "next/server";
import { researchAgent } from "@/lib/agents/research-agent";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Stream the research response
    const streamResult = await researchAgent.stream(query);

    // Convert the stream to a Response
    const encoder = new TextEncoder();
    const reader = streamResult.fullStream.getReader();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value.type === "text-delta") {
              controller.enqueue(encoder.encode(value.payload.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: "Failed to process research request" },
      { status: 500 }
    );
  }
}
