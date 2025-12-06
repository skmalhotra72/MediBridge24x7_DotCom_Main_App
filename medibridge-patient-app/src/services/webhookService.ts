/**
 * MediBridge Webhook Service
 * Handles all communication with n8n AI workflow
 */

// Webhook URL - will use environment variable in production
const N8N_WEBHOOK_URL = '/api/webhook';

// ===================
// TYPE DEFINITIONS
// ===================

export interface WebhookPayload {
  body: {
    prescription_id?: string;
    file_url?: string;
    file_type?: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    organization_id?: string;
    clinic_name?: string;
    query: string;
    chat_session_id: string;
    channel?: string;
    language?: string;
  };
}

export interface WebhookResponse {
  output?: string;
  text?: string;
  error?: string;
}

// ===================
// MAIN FUNCTIONS
// ===================

/**
 * Analyze a prescription document (first upload)
 */
export async function analyzePrescription(data: {
  prescription_id: string;
  file_url: string;
  file_type: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  organization_id?: string;
  clinic_name?: string;
  chat_session_id: string;
}): Promise<WebhookResponse> {
  try {
    const payload: WebhookPayload = {
      body: {
        ...data,
        query: 'Please analyze this prescription and explain all medicines, dosages, and instructions clearly.',
        channel: 'web',
        language: 'auto-detect'
      }
    };

    console.log('[WebhookService] Sending prescription for analysis:', data.prescription_id);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WebhookService] Error response:', errorText);
      throw new Error(`Webhook error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[WebhookService] Analysis complete');
    
    return result;
  } catch (error) {
    console.error('[WebhookService] analyzePrescription failed:', error);
    throw error;
  }
}

/**
 * Send a follow-up question about a prescription
 */
export async function askFollowUpQuestion(data: {
  prescription_id?: string;
  question: string;
  user_id: string;
  user_name?: string;
  chat_session_id: string;
  clinic_name?: string;
}): Promise<WebhookResponse> {
  try {
    const payload: WebhookPayload = {
      body: {
        prescription_id: data.prescription_id,
        user_id: data.user_id,
        user_name: data.user_name,
        clinic_name: data.clinic_name,
        query: data.question,
        chat_session_id: data.chat_session_id,
        channel: 'web',
        language: 'auto-detect'
      }
    };

    console.log('[WebhookService] Sending follow-up question');

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[WebhookService] askFollowUpQuestion failed:', error);
    throw error;
  }
}

/**
 * Health check for webhook
 */
export async function checkWebhookHealth(): Promise<boolean> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: {
          query: 'health_check',
          user_id: 'system',
          chat_session_id: 'health-check'
        }
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Extract the response text from webhook response
 */
export function extractResponseText(response: WebhookResponse): string {
  return response.output || response.text || 'I could not process your request. Please try again.';
}
export interface WebhookPayload {
  body: {
    prescription_id?: string;
    file_url?: string;
    file_type?: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    organization_id?: string;
    clinic_name?: string;
    query: string;  // <-- This carries the chief concern
    chat_session_id: string;
    channel?: string;
    language?: string;
  };
}

/**
 * Analyze a prescription with optional chief concern
 */
export async function analyzePrescription(data: {
  prescription_id: string;
  file_url: string;
  file_type: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  organization_id?: string;
  clinic_name?: string;
  chat_session_id: string;
  chief_concern?: string;  // NEW: Optional chief concern
}): Promise<WebhookResponse> {
  const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
    'https://n8n.nhcare.in/webhook/57b98d1c-fdaf-4e74-bc3e-f14c005de33f';

  // Build query - use chief concern if provided, otherwise default
  const query = data.chief_concern?.trim() 
    ? `${data.chief_concern.trim()}\n\n[Please also analyze the attached prescription and explain all medicines]`
    : 'Please analyze this prescription and explain all medicines, dosages, and instructions clearly.';

  const payload: WebhookPayload = {
    body: {
      prescription_id: data.prescription_id,
      file_url: data.file_url,
      file_type: data.file_type,
      user_id: data.user_id,
      user_name: data.user_name,
      user_email: data.user_email,
      organization_id: data.organization_id,
      clinic_name: data.clinic_name,
      query: query,  // Chief concern passed here
      chat_session_id: data.chat_session_id,
      channel: 'web',
      language: 'auto-detect'
    }
  };

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status}`);
  }

  return response.json();
}