// MediBridge AI API Service
// Connects to n8n webhook for AI-powered healthcare assistant

const N8N_WEBHOOK_URL = 'https://n8n.nhcare.in/webhook/57b98d1c-fdaf-4e74-bc3e-f14c005de33f';

export interface MediBridgeResponse {
  success?: boolean;
  output?: string;
  message?: string;
}

export async function sendMessageToMediBridge(userMessage: string): Promise<string> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MediBridgeResponse = await response.json();
    return data.output || data.message || 'No response received';
    
  } catch (error) {
    console.error('MediBridge API Error:', error);
    throw new Error('Failed to connect to MediBridge AI. Please try again.');
  }
}