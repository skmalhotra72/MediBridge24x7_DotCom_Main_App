import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Store conversation history (in production, use Redis or database)
const conversationHistory: Map<string, Array<{role: string, content: string}>> = new Map();

// Store pending family selections
const pendingSelections: Map<string, any> = new Map();

export async function POST(request: NextRequest) {
  console.log('📞 Twilio Voice Webhook - Incoming Request');
  
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callSid = formData.get('CallSid') as string;
    const speechResult = formData.get('SpeechResult') as string;
    const callStatus = formData.get('CallStatus') as string;
    
    console.log('📱 Call SID:', callSid);
    console.log('📱 Call from:', from);
    console.log('🎤 Speech Result:', speechResult);
    console.log('📊 Call Status:', callStatus);

    const response = new VoiceResponse();

    // If we have speech input, process it with AI
    if (speechResult) {
      console.log('🤖 Processing speech with AI...');
      
      // Get or create conversation history
      let history = conversationHistory.get(callSid) || [];
      
      // Add user message
      history.push({ role: 'user', content: speechResult });
      
      // Get AI response
      const aiResponse = await getAIResponse(from, history);
      console.log('🤖 AI Response:', aiResponse.substring(0, 100) + '...');
      
      // Add AI response to history
      history.push({ role: 'assistant', content: aiResponse });
      conversationHistory.set(callSid, history);
      
      // Speak the AI response
      response.say(
        {
          voice: 'Polly.Aditi',
          language: 'en-IN'
        },
        aiResponse
      );
      
      // Check if AI wants to end the call
      if (aiResponse.toLowerCase().includes('goodbye') || 
          aiResponse.toLowerCase().includes('take care') ||
          history.length > 20) {
        response.say(
          { voice: 'Polly.Aditi', language: 'en-IN' },
          'Thank you for calling MediBridge. Take care!'
        );
        response.hangup();
      } else {
        // Continue listening
        addGatherNode(response, callSid);
      }
    } else {
      // First interaction - greeting
      console.log('👋 First interaction - greeting');
      
      // Try to get patient info using new lookup
      const lookupResult = await getPatientByPhone(from);
      
      if (!lookupResult || !lookupResult.found) {
        // New user - not found in system
        console.log('👤 New user - starting basic conversation');
        
        const greeting = `Namaste! This is Dr. Bridge from MediBridge 24 by 7. 
          I don't see your number in our system yet. 
          But I can still help you with general health questions. 
          How can I assist you today?`;
        
        conversationHistory.set(callSid, [
          { role: 'system', content: getDefaultSystemPrompt() }
        ]);
        
        response.say({ voice: 'Polly.Aditi', language: 'en-IN' }, greeting);
        addGatherNode(response, callSid);
        
      } else if (lookupResult.type === 'multiple_patients' && lookupResult.family_count > 1) {
        // Multiple family members - need selection
        console.log('👨‍👩‍👧‍👦 Multiple patients found:', lookupResult.family_count);
        
        // Store lookup result for the select-patient endpoint
        pendingSelections.set(callSid, lookupResult);
        
        // Build family selection menu
        let menuText = `Namaste ${lookupResult.caller_name?.split(' ')[0]}! This is Dr. Bridge from MediBridge. `;
        menuText += `I found ${lookupResult.family_count} patients linked to your account. `;
        menuText += `Please tell me, who is this call for? `;
        
        lookupResult.family_members.forEach((member: any, index: number) => {
          const orgName = member.organization_name ? ` at ${member.organization_name}` : '';
          if (member.relationship === 'self') {
            menuText += `Press ${index + 1} for yourself, ${member.full_name}${orgName}. `;
          } else {
            menuText += `Press ${index + 1} for ${member.full_name}, ${member.relationship}${orgName}. `;
          }
        });
        
        // Use Gather with DTMF for number selection
        const gather = response.gather({
          input: ['dtmf', 'speech'],
          action: '/api/twilio/voice/select-patient',
          method: 'POST',
          numDigits: 1,
          timeout: 10,
          speechTimeout: 'auto',
          language: 'en-IN'
        });
        
        gather.say({ voice: 'Polly.Aditi', language: 'en-IN' }, menuText);
        
        // Fallback if no input - default to first (self)
        response.say(
          { voice: 'Polly.Aditi', language: 'en-IN' },
          'I did not receive your selection. Let me connect you for yourself.'
        );
        response.redirect({ method: 'POST' }, `/api/twilio/voice/select-patient?Digits=1&CallSid=${callSid}&From=${encodeURIComponent(from)}`);
        
      } else {
        // Single patient - proceed directly
        console.log('👤 Single patient found:', lookupResult.caller_name);
        
        const patient = lookupResult.family_members?.[0] || lookupResult;
        const firstName = lookupResult.caller_name?.split(' ')[0] || 'there';
        
        // Load full patient context
        const fullContext = await loadPatientContext(patient.patient_id, patient.organization_id);
        
        let greeting = `Namaste ${firstName}! This is Dr. Bridge from MediBridge 24 by 7. `;
        
        if (fullContext && fullContext.prescriptions?.length > 0) {
          const rxCount = fullContext.prescriptions.length;
          const medCount = fullContext.prescriptions.reduce(
            (sum: number, rx: any) => sum + (rx.medicines?.length || 0), 0
          );
          greeting += `I have access to your ${rxCount} prescriptions with ${medCount} medicines. `;
        } else {
          greeting += `I have access to your medical records. `;
        }
        greeting += `How can I help you today?`;
        
        // Initialize conversation with full context
        const systemPrompt = buildSystemPromptWithContext(fullContext, lookupResult.caller_name);
        conversationHistory.set(callSid, [
          { role: 'system', content: systemPrompt }
        ]);
        
        response.say({ voice: 'Polly.Aditi', language: 'en-IN' }, greeting);
        addGatherNode(response, callSid);
      }
    }

    return new NextResponse(response.toString(), {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });

  } catch (error: any) {
    console.error('❌ Twilio webhook error:', error);
    
    const response = new VoiceResponse();
    response.say(
      { voice: 'Polly.Aditi', language: 'en-IN' },
      'Sorry, I encountered an error. Please try again or contact the clinic directly.'
    );
    
    return new NextResponse(response.toString(), {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}

// Add Gather node for speech recognition
function addGatherNode(response: any, callSid: string) {
  const gather = response.gather({
    input: ['speech'],
    action: '/api/twilio/voice',
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'phone_call',
    language: 'en-IN',
    enhanced: true,
    timeout: 5
  });
  
  gather.say(
    { voice: 'Polly.Aditi', language: 'en-IN' },
    ''  // Silent - just listening
  );
  
  // If no speech detected, prompt again
  response.say(
    { voice: 'Polly.Aditi', language: 'en-IN' },
    'I didn\'t hear anything. Please go ahead and ask your question.'
  );
  
  // Re-gather
  const retryGather = response.gather({
    input: ['speech'],
    action: '/api/twilio/voice',
    method: 'POST',
    speechTimeout: 'auto',
    speechModel: 'phone_call',
    language: 'en-IN',
    enhanced: true,
    timeout: 10
  });
  
  retryGather.say({ voice: 'Polly.Aditi', language: 'en-IN' }, '');
  
  // Final fallback
  response.say(
    { voice: 'Polly.Aditi', language: 'en-IN' },
    'I still couldn\'t hear you. Please call back when you\'re ready. Goodbye!'
  );
  response.hangup();
}

// Get AI response using OpenAI
async function getAIResponse(phone: string, history: Array<{role: string, content: string}>): Promise<string> {
  try {
    const messages = history.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 
      'I apologize, I could not process that. Could you please repeat?';
  } catch (error) {
    console.error('OpenAI Error:', error);
    return 'I am having trouble connecting. Please try again in a moment.';
  }
}

// Get patient info by phone number using our new RPC function
async function getPatientByPhone(phone: string): Promise<any | null> {
  try {
    // Clean phone number to E.164 format without +
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
      // US number from Twilio (+1...)
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Add India country code
    }
    
    console.log('🔍 Looking up patient with phone:', cleanPhone);
    
    // Use our new voice lookup function
    const { data, error } = await supabase.rpc('lookup_patient_for_voice_call', {
      p_wa_id: cleanPhone
    });

    if (error) {
      console.log('❌ Lookup error:', error.message);
      return null;
    }

    console.log('📋 Lookup result:', JSON.stringify(data, null, 2));

    if (!data.found) {
      console.log('👤 New user - not found in system');
      return null;
    }

    // Return the lookup result with family info
    return {
      ...data,
      full_name: data.caller_name,
      id: data.caller_patient_id
    };

  } catch (error) {
    console.error('❌ Error fetching patient:', error);
    return null;
  }
}

// Load full patient context for AI
async function loadPatientContext(patientId: string, organizationId: string): Promise<any> {
  try {
    console.log('📋 Loading full context for patient:', patientId);
    
    // Get patient details
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();
    
    // Get organization details
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();
    
    // Get clinic context (doctors, lab tests)
    const { data: clinicContext } = await supabase.rpc('get_clinic_context', {
      p_organization_id: organizationId
    });
    
    // Get recent prescriptions with medicines
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select(`
        id,
        prescription_date,
        doctor_name,
        diagnosis,
        chief_complaint,
        ai_summary,
        prescription_items (
          medicine_name,
          dosage,
          frequency,
          timing,
          duration,
          instructions
        )
      `)
      .eq('patient_id', patientId)
      .order('prescription_date', { ascending: false })
      .limit(5);
    
    // Get recent chat sessions
    const { data: chatSessions } = await supabase
      .from('chat_sessions')
      .select('id, created_at, chat_summary')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(3);
    
    const context = {
      patient,
      organization,
      clinic: clinicContext || { doctors: [], lab_tests: [] },
      prescriptions: prescriptions || [],
      chatSessions: chatSessions || []
    };
    
    console.log('✅ Context loaded - Prescriptions:', prescriptions?.length || 0);
    
    return context;
    
  } catch (error) {
    console.error('❌ Error loading patient context:', error);
    return null;
  }
}

// Build system prompt with full context
function buildSystemPromptWithContext(context: any, callerName: string): string {
  if (!context || !context.patient) {
    return getDefaultSystemPrompt();
  }
  
  const { patient, organization, clinic, prescriptions } = context;
  const firstName = callerName?.split(' ')[0] || patient?.full_name?.split(' ')[0] || 'there';
  
  // Build prescriptions info with medicines
  let prescriptionInfo = '';
  if (prescriptions && prescriptions.length > 0) {
    prescriptionInfo = prescriptions.map((rx: any, i: number) => {
      let rxText = `\n### Prescription ${i + 1} (${rx.prescription_date || 'Recent'})`;
      rxText += `\n- Doctor: ${rx.doctor_name || 'Not specified'}`;
      rxText += `\n- Diagnosis: ${rx.diagnosis || rx.chief_complaint || 'General consultation'}`;
      
      if (rx.prescription_items && rx.prescription_items.length > 0) {
        rxText += `\n- Medicines:`;
        rx.prescription_items.forEach((med: any) => {
          rxText += `\n  • ${med.medicine_name} ${med.dosage || ''} - ${med.frequency || ''} ${med.timing || ''} for ${med.duration || 'as directed'}`;
          if (med.instructions) rxText += ` (${med.instructions})`;
        });
      }
      
      return rxText;
    }).join('\n');
  } else {
    prescriptionInfo = 'No prescriptions on file yet.';
  }
  
  // Build doctors info
  let doctorsInfo = 'No doctor information available.';
  if (clinic?.doctors && clinic.doctors.length > 0) {
    doctorsInfo = clinic.doctors.map((doc: any) => 
      `- Dr. ${doc.full_name} (${doc.specialization}) - ₹${doc.consultation_fee}`
    ).join('\n');
  }
  
  // Build allergies/conditions info
  const allergies = patient?.known_allergies?.length > 0 
    ? patient.known_allergies.join(', ') 
    : 'None recorded';
  const conditions = patient?.chronic_conditions?.length > 0 
    ? patient.chronic_conditions.join(', ') 
    : 'None recorded';

  return `You are Dr. Bridge, an AI health assistant from MediBridge 24/7.
You are on a VOICE CALL with the patient. Keep responses SHORT and conversational (2-3 sentences max).

## PATIENT INFORMATION
- Name: ${patient?.full_name || callerName}
- Age: ${patient?.age || 'Not specified'} ${patient?.age_unit || 'years'}
- Gender: ${patient?.gender || 'Not specified'}
- Blood Group: ${patient?.blood_group || 'Not specified'}
- Known Allergies: ${allergies}
- Chronic Conditions: ${conditions}

## CLINIC: ${organization?.name || 'MediBridge Partner Clinic'}
Phone: ${organization?.phone || 'Not available'}

## AVAILABLE DOCTORS
${doctorsInfo}

## PRESCRIPTION HISTORY
${prescriptionInfo}

## YOUR ROLE
1. Help ${firstName} understand their prescriptions and medications
2. Answer questions about dosage, timing, and precautions
3. Reference their ACTUAL prescriptions and medicines listed above
4. Recommend appropriate doctors if they need consultation
5. Be warm, empathetic, and speak clearly

## IMPORTANT RULES
- NEVER prescribe new medications
- NEVER diagnose conditions
- NEVER change dosages
- For emergencies, tell them to call 108 or go to nearest hospital
- Keep responses SHORT (2-3 sentences) - this is a phone call
- Speak naturally, mix Hindi phrases like "Namaste", "ji", "theek hai"
- Reference their specific medicines by name when relevant
- If they ask about a medicine, check their prescription history first

Always address the patient as "${firstName}"`;
}

// Build system prompt with basic patient context (legacy support)
function buildSystemPrompt(patient: any): string {
  // Check if this is the new lookup result format
  if (patient.family_members) {
    const firstPatient = patient.family_members[0];
    return buildSystemPromptWithContext(
      { patient: firstPatient, prescriptions: [] },
      patient.caller_name
    );
  }
  
  const prescriptionInfo = patient.prescriptions?.map((rx: any, i: number) => 
    `Prescription ${i+1}: ${rx.doctor_name || 'Doctor'} - ${rx.diagnosis || rx.chief_complaint || 'General consultation'} (${rx.prescription_date || 'Recent'})`
  ).join('\n') || 'No recent prescriptions found.';

  return `You are Dr. Bridge, an AI health assistant from MediBridge 24/7.

PATIENT INFORMATION:
- Name: ${patient.full_name}
- Age: ${patient.age || 'Not specified'}
- Gender: ${patient.gender || 'Not specified'}
- Location: ${patient.city || 'Not specified'}

RECENT PRESCRIPTIONS:
${prescriptionInfo}

YOUR ROLE:
1. Help the patient understand their prescriptions and medications
2. Answer questions about dosage, timing, and precautions
3. Provide general health guidance
4. Be warm, empathetic, and speak clearly

IMPORTANT RULES:
- NEVER prescribe new medications
- NEVER diagnose conditions
- NEVER change dosages
- For emergencies, tell them to call 108 or go to nearest hospital
- Keep responses SHORT (2-3 sentences) - this is a phone call
- Speak in simple language, mix Hindi phrases if appropriate

Always address the patient by their first name: "${patient.full_name?.split(' ')[0] || 'there'}"`;
}

// Default system prompt for unknown callers
function getDefaultSystemPrompt(): string {
  return `You are Dr. Bridge, an AI health assistant from MediBridge 24/7.

YOUR ROLE:
1. Help patients with general health questions
2. Explain medications and health concepts
3. Guide them to appropriate care

IMPORTANT RULES:
- NEVER prescribe medications
- NEVER diagnose conditions  
- For emergencies, tell them to call 108 or go to nearest hospital
- Keep responses SHORT (2-3 sentences) - this is a phone call
- Be warm and empathetic

You don't have this caller's medical records yet. Encourage them to register on the MediBridge app for personalized assistance.`;
}

// Export pendingSelections for use by select-patient route
export { pendingSelections, conversationHistory, loadPatientContext, buildSystemPromptWithContext, addGatherNode };

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'Twilio Voice Webhook with AI',
    version: '3.0',
    features: [
      'Speech recognition',
      'OpenAI GPT-4o responses', 
      'Patient context from Supabase',
      'Family member selection',
      'Full prescription & medicine context',
      'Clinic doctors & lab tests context',
      'Conversation history'
    ]
  });
}