import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { 
  pendingSelections, 
  conversationHistory, 
  loadPatientContext, 
  buildSystemPromptWithContext,
  addGatherNode 
} from '../route';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('📞 Patient Selection - Incoming Request');
  
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const digits = formData.get('Digits') as string;
    const speechResult = formData.get('SpeechResult') as string;
    const from = formData.get('From') as string;
    
    // Also check URL params (for redirect fallback)
    const url = new URL(request.url);
    const urlDigits = url.searchParams.get('Digits');
    const urlCallSid = url.searchParams.get('CallSid');
    
    const finalCallSid = callSid || urlCallSid || '';
    const finalDigits = digits || urlDigits || '';
    
    console.log('📱 Call SID:', finalCallSid);
    console.log('🔢 Digits pressed:', finalDigits);
    console.log('🎤 Speech result:', speechResult);

    const response = new VoiceResponse();
    
    // Get the pending selection data
    const lookupResult = pendingSelections.get(finalCallSid);
    
    if (!lookupResult || !lookupResult.family_members) {
      console.log('❌ No pending selection found for CallSid:', finalCallSid);
      response.say(
        { voice: 'Polly.Aditi', language: 'en-IN' },
        'Sorry, I lost track of our conversation. Let me start over.'
      );
      response.redirect({ method: 'POST' }, '/api/twilio/voice');
      return new NextResponse(response.toString(), {
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      });
    }
    
    // Determine which patient was selected
    let selectedIndex = -1;
    
    // Try DTMF digits first
    if (finalDigits && !isNaN(parseInt(finalDigits))) {
      selectedIndex = parseInt(finalDigits) - 1; // Convert 1-based to 0-based
    }
    // Try speech result - look for name or number
    else if (speechResult) {
      const speech = speechResult.toLowerCase();
      
      // Check for number words
      const numberWords: { [key: string]: number } = {
        'one': 0, 'first': 0, 'ek': 0, 'pehla': 0,
        'two': 1, 'second': 1, 'do': 1, 'doosra': 1,
        'three': 2, 'third': 2, 'teen': 2, 'teesra': 2,
        'four': 3, 'fourth': 3, 'char': 3, 'chautha': 3,
        'five': 4, 'fifth': 4, 'paanch': 4,
        'six': 5, 'sixth': 5, 'cheh': 5,
        'myself': 0, 'mera': 0, 'apna': 0, 'khud': 0, 'self': 0
      };
      
      for (const [word, index] of Object.entries(numberWords)) {
        if (speech.includes(word)) {
          selectedIndex = index;
          break;
        }
      }
      
      // Check for patient names
      if (selectedIndex === -1) {
        lookupResult.family_members.forEach((member: any, index: number) => {
          const memberName = member.full_name.toLowerCase();
          const firstName = memberName.split(' ')[0];
          if (speech.includes(firstName) || speech.includes(memberName)) {
            selectedIndex = index;
          }
        });
      }
    }
    
    // Validate selection
    if (selectedIndex < 0 || selectedIndex >= lookupResult.family_members.length) {
      console.log('❌ Invalid selection:', selectedIndex);
      
      // Default to first patient (usually self)
      selectedIndex = 0;
      response.say(
        { voice: 'Polly.Aditi', language: 'en-IN' },
        'I could not understand your selection. Connecting you for ' + 
        lookupResult.family_members[0].full_name + '.'
      );
    }
    
    // Get the selected patient
    const selectedPatient = lookupResult.family_members[selectedIndex];
    console.log('✅ Selected patient:', selectedPatient.full_name);
    
    // Clear pending selection
    pendingSelections.delete(finalCallSid);
    
    // Load full context for selected patient
    const fullContext = await loadPatientContext(
      selectedPatient.patient_id, 
      selectedPatient.organization_id
    );
    
    // Build greeting
    const firstName = selectedPatient.full_name.split(' ')[0];
    const relationship = selectedPatient.relationship;
    
    let greeting = '';
    if (relationship === 'self') {
      greeting = `Perfect ${firstName}! `;
    } else {
      greeting = `Okay, I'll help you with ${firstName}'s health queries. `;
    }
    
    // Add context about what we know
    if (fullContext && fullContext.prescriptions?.length > 0) {
      const rxCount = fullContext.prescriptions.length;
      const medCount = fullContext.prescriptions.reduce(
        (sum: number, rx: any) => sum + (rx.prescription_items?.length || 0), 0
      );
      greeting += `I have ${rxCount} prescriptions with ${medCount} medicines on record. `;
    } else {
      greeting += `I have access to the medical records. `;
    }
    greeting += `How can I help you today?`;
    
    // Initialize conversation with full context
    const systemPrompt = buildSystemPromptWithContext(fullContext, selectedPatient.full_name);
    conversationHistory.set(finalCallSid, [
      { role: 'system', content: systemPrompt }
    ]);
    
    // Speak and listen
    response.say({ voice: 'Polly.Aditi', language: 'en-IN' }, greeting);
    addGatherNode(response, finalCallSid);

    return new NextResponse(response.toString(), {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });

  } catch (error: any) {
    console.error('❌ Patient selection error:', error);
    
    const response = new VoiceResponse();
    response.say(
      { voice: 'Polly.Aditi', language: 'en-IN' },
      'Sorry, I encountered an error. Let me transfer you to our support team.'
    );
    response.redirect({ method: 'POST' }, '/api/twilio/voice');
    
    return new NextResponse(response.toString(), {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'Twilio Voice - Patient Selection',
    version: '1.0'
  });
}