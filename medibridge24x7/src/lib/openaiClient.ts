import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('VITE_OPENAI_API_KEY is not set. OpenAI features will be disabled.');
}

export const openai = apiKey
  ? new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, use a backend API route instead
    })
  : null;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateResponseOptions {
  messages: ChatMessage[];
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  organizationName?: string;
}

/**
 * Generate an AI response for a chat message
 * @param options - Options for generating the response
 * @returns The AI-generated response text
 */
export async function generateAIResponse(
  options: GenerateResponseOptions
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  const { messages, patientName, patientAge, patientGender, organizationName } = options;

  // Build system prompt for medical assistant
  const systemPrompt = `You are a helpful medical assistant AI for ${organizationName || 'a healthcare organization'}. 
Your role is to:
- Provide general health information and guidance
- Help patients understand their symptoms
- Answer questions about medications and treatments
- Assist with appointment scheduling and general inquiries
- Escalate complex medical cases to healthcare professionals when appropriate

Important guidelines:
- Always remind users that you are an AI assistant and cannot replace professional medical advice
- For serious symptoms or emergencies, advise users to seek immediate medical attention
- Be empathetic, clear, and professional in your responses
- If you don't know something, admit it rather than guessing
- Maintain patient privacy and confidentiality

${patientName ? `Current patient: ${patientName}` : ''}
${patientAge ? `Age: ${patientAge}` : ''}
${patientGender ? `Gender: ${patientGender}` : ''}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response generated from OpenAI');
    }

    return response;
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(
      error.message || 'Failed to generate AI response. Please try again later.'
    );
  }
}

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIAvailable(): boolean {
  return openai !== null && !!apiKey;
}















