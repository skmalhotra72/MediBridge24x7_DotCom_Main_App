import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  console.log('📞 Twilio Media Stream - Incoming Call');
  
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callSid = formData.get('CallSid') as string;
    
    console.log('📱 Call SID:', callSid);
    console.log('📱 From:', from);
    console.log('📱 To:', to);

    // Create TwiML response with Media Streams
    const response = new VoiceResponse();
    
    // Initial greeting while we connect
    response.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Namaste! Dr. Bridge se connect ho rahe hain. Kripya pratiksha karein.'
    );
    
    // Start Media Stream - connects to our WebSocket server
    const connect = response.connect();
    
    // The WebSocket URL for real-time audio streaming
    const websocketUrl = `wss://${request.headers.get('host')}/api/twilio/media-stream/websocket`;
    
    connect.stream({
      url: websocketUrl,
      parameters: {
        from: from,
        to: to,
        callSid: callSid
      }
    });

    const twiml = response.toString();
    console.log('📝 TwiML Response:', twiml);

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });

  } catch (error: any) {
    console.error('❌ Media Stream error:', error);
    
    const response = new VoiceResponse();
    response.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Maaf kijiye, kuch technical problem hai. Kripya baad mein call karein.'
    );
    
    return new NextResponse(response.toString(), {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}

// Handle GET for testing
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'Twilio Media Stream for Dr. Bridge AI',
    version: '1.0',
    features: [
      'Real-time audio streaming',
      'OpenAI Realtime API integration',
      'Patient context loading',
      'Bidirectional conversation'
    ]
  });
}