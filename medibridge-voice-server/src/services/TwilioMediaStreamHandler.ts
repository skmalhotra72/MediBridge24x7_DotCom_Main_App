import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface TwilioMessage {
  event: string;
  streamSid?: string;
  start?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    customParameters?: {
      from?: string;
      to?: string;
      callerPhone?: string;
      calledNumber?: string;
      callSid?: string;
      callSource?: string;
    };
  };
  media?: {
    payload: string;
  };
  stop?: {
    accountSid: string;
    callSid: string;
  };
}

interface TranscriptEntry {
  role: 'patient' | 'ai';
  text: string;
  timestamp: string;
}

interface FamilyMember {
  patient_id: string;
  full_name: string;
  relationship: string;
  organization_id: string;
  organization_name: string;
  age: number | null;
  gender: string | null;
}

type CallState = 'INITIALIZING' | 'CONFIRMING_IDENTITY' | 'SELECTING_PATIENT' | 'LOADING_CONTEXT' | 'CONVERSATION' | 'ONBOARDING_NEW';

export class TwilioMediaStreamHandler {
  private twilioWs: WebSocket;
  private openaiWs: WebSocket | null = null;
  private streamSid: string = '';
  private callSid: string = '';
  private callerPhone: string = '';
  private callSource: string = 'phone';
  private patientContext: any = null;
  private isConnected: boolean = false;
  
  // State machine
  private callState: CallState = 'INITIALIZING';
  private selectedPatientId: string | null = null;
  private selectedOrganizationId: string | null = null;
  private familyMembers: FamilyMember[] = [];
  private callerName: string = '';
  private callerAuthUserId: string | null = null;
  
  // Call logging
  private voiceCallId: string | null = null;
  private callStartTime: Date = new Date();
  private transcript: TranscriptEntry[] = [];

  constructor(twilioWs: WebSocket) {
    this.twilioWs = twilioWs;
    console.log('📞 TwilioMediaStreamHandler initialized');
  }

  public async handleMessage(message: TwilioMessage): Promise<void> {
    switch (message.event) {
      case 'connected':
        console.log('✅ Twilio Media Stream connected');
        break;

      case 'start':
        console.log('🎬 Stream started:', message.start?.streamSid);
        this.streamSid = message.start?.streamSid || '';
        this.callSid = message.start?.customParameters?.callSid || message.start?.callSid || '';
        this.callerPhone = message.start?.customParameters?.callerPhone || '';
        this.callSource = message.start?.customParameters?.callSource || 'phone';
        console.log('📱 Caller Phone:', this.callerPhone, 'CallSid:', this.callSid, 'Source:', this.callSource);
        this.callStartTime = new Date();
        await this.initializeCall();
        break;

      case 'media':
        if (this.openaiWs && this.isConnected && message.media?.payload) {
          this.sendAudioToOpenAI(message.media.payload);
        }
        break;

      case 'stop':
        console.log('🛑 Stream stopped');
        await this.endCall();
        this.cleanup();
        break;

      default:
        console.log('📨 Unknown event:', message.event);
    }
  }

  private async initializeCall(): Promise<void> {
    try {
      console.log('🔍 Looking up patient:', this.callerPhone);
      
      // Clean phone number - handle various formats
      let cleanPhone = this.callerPhone.replace(/[^\d]/g, '');
      
      // Handle different phone formats
      if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
        cleanPhone = cleanPhone.substring(1);
      }
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }
      // If starts with +91, remove the +
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        // Already in correct format
      }

      console.log('🔢 Cleaned phone:', cleanPhone);

      // Lookup patient
      const { data: lookupResult, error } = await supabase.rpc('lookup_patient_for_voice_call', {
        p_wa_id: cleanPhone
      });

      if (error) {
        console.log('❌ Patient lookup error:', error.message);
        this.callState = 'ONBOARDING_NEW';
      } else if (lookupResult?.found) {
        console.log('✅ Patient found:', lookupResult.caller_name);
        console.log('👨‍👩‍👧‍👦 Family members:', lookupResult.family_count);
        
        // Store lookup data
        this.callerName = lookupResult.caller_name || 'Friend';
        this.callerAuthUserId = lookupResult.caller_auth_user_id;
        this.familyMembers = lookupResult.family_members || [];
        
        // FIX: Use caller_patient_id (the person who owns this phone) not family_members[0]
        const callerPatientId = lookupResult.caller_patient_id;
        
        // Find the caller's patient record to get their org
        const callerRecord = this.familyMembers.find(m => m.patient_id === callerPatientId);
        
        if (callerRecord) {
          this.selectedPatientId = callerRecord.patient_id;
          this.selectedOrganizationId = callerRecord.organization_id;
        }
        
        // Store full context for later
        this.patientContext = {
          ...lookupResult,
          callerPatientId
        };
        
        // Determine call state based on family members
        if (this.familyMembers.length > 1) {
          this.callState = 'SELECTING_PATIENT';
        } else if (this.familyMembers.length === 1) {
          this.callState = 'LOADING_CONTEXT';
          this.selectedPatientId = this.familyMembers[0].patient_id;
          this.selectedOrganizationId = this.familyMembers[0].organization_id;
        } else {
          this.callState = 'ONBOARDING_NEW';
        }
      } else {
        console.log('👤 New caller - no patient record');
        this.callState = 'ONBOARDING_NEW';
      }

      // If we have a selected patient, load their full context
      if (this.selectedPatientId && this.selectedOrganizationId && this.callState === 'LOADING_CONTEXT') {
        await this.loadPatientContext(this.selectedPatientId, this.selectedOrganizationId);
        this.callState = 'CONVERSATION';
      }

      // Create voice call record
      const { data: voiceCall, error: insertError } = await supabase
        .from('voice_calls')
        .insert({
          call_sid: this.callSid,
          stream_sid: this.streamSid,
          caller_phone: cleanPhone,
          patient_id: this.selectedPatientId,
          organization_id: this.selectedOrganizationId,
          call_status: 'connected',
          call_direction: 'inbound',
          call_source: this.callSource,
          connected_at: new Date().toISOString(),
          metadata: {
            original_phone: this.callerPhone,
            patient_name: this.callerName || 'Unknown',
            call_state: this.callState,
            family_count: this.familyMembers.length
          }
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error creating voice call record:', insertError.message);
      } else {
        this.voiceCallId = voiceCall.id;
        console.log('✅ Voice call record created:', this.voiceCallId);
      }

      console.log('📊 Call State:', this.callState);
      await this.connectToOpenAI();

    } catch (error) {
      console.error('❌ Error initializing call:', error);
    }
  }

  private async loadPatientContext(patientId: string, organizationId: string): Promise<void> {
    try {
      console.log('📋 Loading context for patient:', patientId, 'org:', organizationId);
      
      const { data: smartContext, error: smartError } = await supabase.rpc('get_patient_smart_context', {
        p_patient_id: patientId,
        p_query_type: 'prescription'
      });

      if (smartError) {
        console.error('❌ Smart context error:', smartError.message);
      } else {
        console.log('📋 Smart context loaded:', {
          patient: smartContext?.patient?.full_name || 'N/A',
          prescriptions: smartContext?.prescriptions?.length || 0,
          prescriptionDetails: smartContext?.prescriptions?.slice(0, 3).map((p: any) => ({
            doctor: p.doctor_name,
            diagnosis: p.diagnosis,
            medicines: p.medicines?.length || 0
          }))
        });
      }

      const { data: clinicContext, error: clinicError } = await supabase.rpc('get_clinic_context', {
        p_organization_id: organizationId
      });

      if (clinicError) {
        console.error('❌ Clinic context error:', clinicError.message);
      } else {
        console.log('🏥 Clinic context loaded:', {
          clinic: clinicContext?.clinic?.name || 'N/A',
          doctors: clinicContext?.doctors?.length || 0
        });
      }

      this.patientContext = {
        ...this.patientContext,
        smartContext,
        clinicContext
      };

      console.log('✅ Full patient context loaded');
    } catch (error) {
      console.error('⚠️ Error loading patient context:', error);
    }
  }

  private async connectToOpenAI(): Promise<void> {
    try {
      console.log('🤖 Connecting to OpenAI Realtime...');

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      const systemInstructions = this.buildSystemInstructions();

      const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
      
      this.openaiWs = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      this.openaiWs.on('open', () => {
        console.log('✅ Connected to OpenAI Realtime');
        this.isConnected = true;

        // Configure session with tools for patient selection
        const sessionConfig: any = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            voice: 'alloy',
            instructions: systemInstructions,
            input_audio_format: 'g711_ulaw',
            output_audio_format: 'g711_ulaw',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800
            }
          }
        };

        // Add tools for patient selection if needed
        if (this.callState === 'SELECTING_PATIENT') {
          sessionConfig.session.tools = [
            {
              type: 'function',
              name: 'select_patient',
              description: 'Select which family member/patient this call is for based on user response',
              parameters: {
                type: 'object',
                properties: {
                  patient_name: {
                    type: 'string',
                    description: 'The name of the patient selected by the caller'
                  },
                  patient_index: {
                    type: 'number',
                    description: 'The index (1-based) of the patient in the family list'
                  }
                },
                required: ['patient_name']
              }
            }
          ];
          sessionConfig.session.tool_choice = 'auto';
        }

        this.openaiWs?.send(JSON.stringify(sessionConfig));

        setTimeout(() => {
          this.triggerGreeting();
        }, 500);
      });

      this.openaiWs.on('message', (data: Buffer) => {
        this.handleOpenAIMessage(JSON.parse(data.toString()));
      });

      this.openaiWs.on('close', () => {
        console.log('🔌 OpenAI connection closed');
        this.isConnected = false;
      });

      this.openaiWs.on('error', (error) => {
        console.error('❌ OpenAI WebSocket error:', error);
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ Error connecting to OpenAI:', error);
    }
  }

  private buildSystemInstructions(): string {
    const callerFirstName = this.callerName?.split(' ')[0] || 'there';
    
    // Different instructions based on call state
    if (this.callState === 'ONBOARDING_NEW') {
      return this.buildNewUserInstructions();
    }
    
    if (this.callState === 'SELECTING_PATIENT') {
      return this.buildPatientSelectionInstructions(callerFirstName);
    }
    
    // Normal conversation with full context
    return this.buildConversationInstructions(callerFirstName);
  }

  private buildNewUserInstructions(): string {
    return `You are Dr. Bridge, a friendly AI health assistant from MediBridge 24/7.

You are on a VOICE CALL with a NEW USER who is not yet registered in our system.

GREETING (70% English, 30% Hindi):
"Hello! Welcome to MediBridge 24/7. I'm Dr. Bridge, your AI health assistant. Main aapki kaise madad kar sakta hoon? You can talk to me in Hindi, English, or any language you prefer - I understand them all!"

YOUR TASK:
1. Warmly welcome them
2. Explain that they're not yet registered
3. Offer to help them register OR help with general health questions
4. If they want to register, collect: Full Name, Age, Gender
5. For general questions, help them but mention registration benefits

REGISTRATION FLOW:
- Ask: "Would you like me to help you register? It only takes a minute and you'll get personalized health support."
- If yes: "Great! Let me get a few details. What is your full name?"
- Then: "And your age?"
- Then: "And your gender - male, female, or other?"
- Confirm: "Perfect! I have [name], [age] years old, [gender]. Is that correct?"

RULES:
- Be warm and welcoming
- Keep responses SHORT (2-3 sentences for voice)
- NEVER prescribe medications or diagnose
- For emergencies: "Please call 108 or go to nearest hospital immediately"
- Mix English and Hindi naturally`;
  }

  private buildPatientSelectionInstructions(callerFirstName: string): string {
    // Build family member list for the prompt
    const familyList = this.familyMembers.map((m, i) => {
      const ageGender = [m.age ? `${m.age} years` : null, m.gender].filter(Boolean).join(', ');
      return `${i + 1}. ${m.full_name} (${m.relationship})${ageGender ? ` - ${ageGender}` : ''}`;
    }).join('\n');

    return `You are Dr. Bridge, a friendly AI health assistant from MediBridge 24/7.

You are on a VOICE CALL. The caller is ${this.callerName} and they have ${this.familyMembers.length} family members registered.

GREETING (70% English, 30% Hindi):
"Hello ${callerFirstName}! Welcome to MediBridge 24/7. I'm Dr. Bridge, your AI health assistant. Aap mujhse Hindi, English ya kisi bhi language mein baat kar sakte hain - I understand them all!

Before we start, please tell me - who is this call regarding? Is it for yourself, or someone else in your family?"

REGISTERED FAMILY MEMBERS:
${familyList}

YOUR TASK:
1. Greet the caller warmly
2. Ask WHO this call is for (very important!)
3. Listen to their response
4. Use the 'select_patient' function to record their choice
5. Once selected, I will load that patient's medical records

IMPORTANT:
- You MUST ask who the call is for before providing any medical information
- Wait for their response before proceeding
- If they say a name, match it to the family list
- If unclear, list the options: "${this.familyMembers.map(m => m.full_name).join(', ')}"

RULES:
- Keep responses SHORT (2-3 sentences for voice)
- Be warm and conversational
- NEVER prescribe medications or diagnose
- For emergencies: "Please call 108 immediately"`;
  }

  private buildConversationInstructions(callerFirstName: string): string {
    let patientInfo = '';
    let prescriptionInfo = '';
    let clinicInfo = '';
    
    // Get the selected patient's name (might be different from caller)
    const selectedPatient = this.familyMembers.find(m => m.patient_id === this.selectedPatientId);
    const patientName = selectedPatient?.full_name || this.callerName;
    const patientFirstName = patientName?.split(' ')[0] || 'there';
    
    if (this.patientContext?.smartContext) {
      const sc = this.patientContext.smartContext;
      patientInfo = `
PATIENT INFORMATION:
- Name: ${sc.patient?.full_name || patientName}
- Age: ${sc.patient?.age || 'Not specified'}
- Gender: ${sc.patient?.gender || 'Not specified'}
- Blood Group: ${sc.patient?.blood_group || 'Not specified'}
- Allergies: ${sc.patient?.known_allergies?.join(', ') || 'None recorded'}
- Chronic Conditions: ${sc.patient?.chronic_conditions?.join(', ') || 'None recorded'}`;

      if (sc.prescriptions && sc.prescriptions.length > 0) {
        prescriptionInfo = `

PRESCRIPTIONS ON FILE: ${sc.prescriptions.length}
${sc.prescriptions.slice(0, 5).map((rx: any, i: number) => `
📋 Prescription ${i + 1}:
   - Doctor: Dr. ${rx.doctor_name || 'Unknown'}
   - Date: ${rx.created_at ? new Date(rx.created_at).toLocaleDateString() : 'N/A'}
   - Diagnosis: ${rx.diagnosis || 'General consultation'}
   - Medicines: ${rx.medicines?.map((m: any) => `${m.medicine_name} (${m.dosage || 'as directed'})`).join(', ') || 'See prescription'}
`).join('')}`;
      } else {
        prescriptionInfo = `

PRESCRIPTIONS: No prescriptions found for this patient.`;
      }
    }

    if (this.patientContext?.clinicContext) {
      const cc = this.patientContext.clinicContext;
      clinicInfo = `

CLINIC: ${cc.clinic?.name || 'MediBridge Partner Clinic'}
AVAILABLE DOCTORS:
${cc.doctors?.slice(0, 5).map((d: any) => `- Dr. ${d.full_name} (${d.specialization || 'General'}) - ₹${d.consultation_fee || 'Contact clinic'}`).join('\n') || 'Contact clinic for doctor information'}`;
    }

    // Determine if caller is calling for self or someone else
    const isCallingForSelf = this.selectedPatientId === this.patientContext?.callerPatientId;
    const relationshipNote = isCallingForSelf 
      ? '' 
      : `\nNOTE: ${callerFirstName} is calling on behalf of ${patientFirstName}. Address medical info about ${patientFirstName} but speak to ${callerFirstName}.`;

    return `You are Dr. Bridge, a friendly AI health assistant from MediBridge 24/7.

You are on a VOICE CALL. Keep all responses SHORT and conversational (2-3 sentences max).
${relationshipNote}
${patientInfo}
${prescriptionInfo}
${clinicInfo}

GREETING (70% English, 30% Hindi):
"${isCallingForSelf 
  ? `Great ${patientFirstName}! I have your medical records ready. Aapki ${this.patientContext?.smartContext?.prescriptions?.length || 0} prescriptions hain mere paas. How can I help you today? Feel free to ask about your medicines, dosages, or any health concerns.`
  : `Okay ${callerFirstName}! I have ${patientFirstName}'s medical records ready. Unki ${this.patientContext?.smartContext?.prescriptions?.length || 0} prescriptions hain mere paas. How can I help you today?`
}"

WHAT YOU CAN HELP WITH:
- Explain medicines and their dosages
- Clarify prescription instructions (when to take, with food/empty stomach)
- Explain what conditions medicines treat
- Help book follow-up appointments
- Answer general health questions
- Provide clinic and doctor information

RULES:
- Be warm, empathetic, speak clearly
- Reference patient's actual prescriptions and medicines
- NEVER prescribe NEW medications
- NEVER diagnose NEW conditions
- For emergencies: "Please call 108 or visit the nearest hospital immediately"
- Keep responses SHORT for voice conversation
- Mix Hindi and English naturally (Hinglish)
- If asked about a medicine not in records, say "I don't see that in your current prescriptions, but I can help with general information"

LANGUAGE:
- You can understand and respond in Hindi, English, Hinglish, or any other language the patient speaks
- Match the patient's language preference`;
  }

  private triggerGreeting(): void {
    if (!this.openaiWs || !this.isConnected) return;

    console.log('🎤 Triggering AI greeting... State:', this.callState);

    this.openaiWs.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: 'The call has just connected. Please greet the caller appropriately based on your instructions.'
        }]
      }
    }));

    setTimeout(() => {
      this.openaiWs?.send(JSON.stringify({ type: 'response.create' }));
    }, 100);
  }

  private sendAudioToOpenAI(base64Audio: string): void {
    if (!this.openaiWs || !this.isConnected) return;

    this.openaiWs.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: base64Audio
    }));
  }

  private async handleOpenAIMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'session.created':
        console.log('✅ OpenAI session created');
        break;

      case 'session.updated':
        console.log('✅ OpenAI session configured');
        break;

      case 'response.audio.delta':
        if (message.delta && this.twilioWs.readyState === WebSocket.OPEN) {
          this.twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid: this.streamSid,
            media: {
              payload: message.delta
            }
          }));
        }
        break;

      case 'response.audio.done':
        console.log('🔊 AI audio response complete');
        break;

      case 'response.audio_transcript.done':
        if (message.transcript) {
          console.log('🤖 Dr. Bridge:', message.transcript.substring(0, 100) + (message.transcript.length > 100 ? '...' : ''));
          this.transcript.push({
            role: 'ai',
            text: message.transcript,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript) {
          console.log('👤 Patient:', message.transcript.substring(0, 100) + (message.transcript.length > 100 ? '...' : ''));
          this.transcript.push({
            role: 'patient',
            text: message.transcript,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'response.function_call_arguments.done':
        // Handle function calls (patient selection)
        await this.handleFunctionCall(message);
        break;

      case 'error':
        console.error('❌ OpenAI error:', message.error);
        break;

      default:
        break;
    }
  }

  private async handleFunctionCall(message: any): Promise<void> {
    console.log('🔧 Function call:', message.name, message.arguments);
    
    if (message.name === 'select_patient') {
      try {
        const args = JSON.parse(message.arguments || '{}');
        const patientName = args.patient_name?.toLowerCase() || '';
        const patientIndex = args.patient_index;

        // Find the selected patient
        let selectedMember: FamilyMember | undefined;
        
        // Check if user is selecting themselves (for me, myself, mera, khud, self)
        const selfIndicators = ['for me', 'myself', 'mera', 'mere liye', 'khud', 'self', 'apne liye', 'main'];
        const callerFirstName = this.callerName?.toLowerCase().split(' ')[0] || '';
        const isSelfSelection = selfIndicators.some(indicator => patientName.includes(indicator)) ||
                               patientName.includes(callerFirstName);
        
        if (isSelfSelection && this.patientContext?.callerPatientId) {
          // User is selecting themselves - use the caller's patient record directly
          console.log('👤 Self-selection detected, using caller_patient_id:', this.patientContext.callerPatientId);
          selectedMember = this.familyMembers.find(m => m.patient_id === this.patientContext.callerPatientId);
          
          // If not found in family list (edge case), create from context
          if (!selectedMember) {
            selectedMember = {
              patient_id: this.patientContext.callerPatientId,
              full_name: this.callerName,
              relationship: 'self',
              organization_id: this.familyMembers.find(m => m.patient_id === this.patientContext.callerPatientId)?.organization_id || '',
              organization_name: '',
              age: null,
              gender: null
            };
          }
        } else if (patientIndex && patientIndex > 0 && patientIndex <= this.familyMembers.length) {
          selectedMember = this.familyMembers[patientIndex - 1];
        } else if (patientName) {
          // For family members, search by name
          selectedMember = this.familyMembers.find(m => 
            m.full_name.toLowerCase().includes(patientName) ||
            patientName.includes(m.full_name.toLowerCase().split(' ')[0])
          );
        }

        if (selectedMember) {
          console.log('✅ Patient selected:', selectedMember.full_name);
          
          this.selectedPatientId = selectedMember.patient_id;
          this.selectedOrganizationId = selectedMember.organization_id;
          
          // Load the selected patient's context
          await this.loadPatientContext(selectedMember.patient_id, selectedMember.organization_id);
          
          // Update call state
          this.callState = 'CONVERSATION';
          
          // Update voice call record
          if (this.voiceCallId) {
            await supabase
              .from('voice_calls')
              .update({
                patient_id: selectedMember.patient_id,
                organization_id: selectedMember.organization_id,
                metadata: {
                  original_phone: this.callerPhone,
                  patient_name: selectedMember.full_name,
                  selected_by: this.callerName,
                  call_state: this.callState
                }
              })
              .eq('id', this.voiceCallId);
          }

          // Update OpenAI session with new instructions
          const newInstructions = this.buildConversationInstructions(this.callerName.split(' ')[0]);
          
          this.openaiWs?.send(JSON.stringify({
            type: 'session.update',
            session: {
              instructions: newInstructions,
              tools: [] // Remove tools after selection
            }
          }));

          // Send function result back
          this.openaiWs?.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: message.call_id,
              output: JSON.stringify({
                success: true,
                patient_name: selectedMember.full_name,
                prescriptions_count: this.patientContext?.smartContext?.prescriptions?.length || 0
              })
            }
          }));

          // Trigger response
          this.openaiWs?.send(JSON.stringify({ type: 'response.create' }));

        } else {
          console.log('⚠️ Could not find matching patient');
          
          this.openaiWs?.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: message.call_id,
              output: JSON.stringify({
                success: false,
                error: 'Could not find matching patient',
                available_patients: this.familyMembers.map(m => m.full_name)
              })
            }
          }));

          this.openaiWs?.send(JSON.stringify({ type: 'response.create' }));
        }
      } catch (error) {
        console.error('❌ Error handling function call:', error);
      }
    }
  }

  private async endCall(): Promise<void> {
    if (!this.voiceCallId) return;

    try {
      const endTime = new Date();
      const durationSeconds = Math.round((endTime.getTime() - this.callStartTime.getTime()) / 1000);

      const { error } = await supabase
        .from('voice_calls')
        .update({
          call_status: 'completed',
          ended_at: endTime.toISOString(),
          duration_seconds: durationSeconds,
          conversation_transcript: this.transcript,
          metadata: {
            original_phone: this.callerPhone,
            patient_name: this.patientContext?.smartContext?.patient?.full_name || this.callerName || 'Unknown',
            caller_name: this.callerName,
            transcript_count: this.transcript.length,
            final_state: this.callState,
            call_source: this.callSource
          }
        })
        .eq('id', this.voiceCallId);

      if (error) {
        console.error('❌ Error updating voice call record:', error.message);
      } else {
        console.log(`✅ Voice call completed: ${durationSeconds}s, ${this.transcript.length} messages`);
      }
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  }

  public cleanup(): void {
    console.log('🧹 Cleaning up...');
    
    if (this.openaiWs) {
      this.openaiWs.close();
      this.openaiWs = null;
    }
    
    this.isConnected = false;
  }
}