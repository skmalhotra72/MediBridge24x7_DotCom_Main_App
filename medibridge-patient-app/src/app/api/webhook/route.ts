import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://n8n.nhcare.in/webhook/medibridge-chat-v6-test';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[API Proxy] Forwarding request to n8n:', JSON.stringify(body, null, 2));

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get response text first
    const responseText = await response.text();
    
    console.log('[API Proxy] n8n response status:', response.status);
    console.log('[API Proxy] n8n response:', responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // If not JSON, wrap in object
      data = { output: responseText };
    }

    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
}