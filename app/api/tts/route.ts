// In app/api/tts/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Get the text you want to convert from the client
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const url = 'https://api.fish.audio/v1/tts';
    const options = {
      method: 'POST',
      headers: {
        model: 's1',
        Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      // Pass the text from the client into the body
      body: JSON.stringify({
        text: text,
        reference_id: 'e605a2a42b0a44ccb7af2e42e1676c92',
        format: 'mp3'
        // ... add other options like temperature if you want
      })
    };

    const fishResponse = await fetch(url, options);

    if (!fishResponse.ok) {
      // Send back any error from Fish Audio
      const errorData = await fishResponse.json();
      console.error('Fish Audio Error:', errorData);
      return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
    }

    // 3. Send the audio data back to your frontend
    // We return the raw audio data (as a 'blob')
    return new NextResponse(fishResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error('TTS Route Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}