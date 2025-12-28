import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔄 Proxying chat request to n8n:', body.query?.substring(0, 50));

    const response = await fetch('https://n8n.nhcare.in/webhook/medibridge-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('n8n response not ok:', response.status);
      return NextResponse.json(
        { error: 'AI service error', output: "I'm having trouble connecting. Please try again." },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ n8n response received');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chat proxy error:', error.message);
    return NextResponse.json(
      { error: 'Connection failed', output: "I'm having trouble connecting right now. Please try again." },
      { status: 500 }
    );
  }
}