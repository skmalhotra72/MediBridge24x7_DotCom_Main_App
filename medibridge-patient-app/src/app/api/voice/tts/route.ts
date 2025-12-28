import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'nova', speed = 1.0 } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Limit text length to avoid huge audio files
    const truncatedText = text.slice(0, 4000);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: truncatedText,
        voice: voice, // Options: alloy, echo, fable, onyx, nova, shimmer
        speed: speed, // 0.25 to 4.0
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI TTS Error:', error);
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}