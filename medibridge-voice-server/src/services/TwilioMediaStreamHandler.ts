import WebSocket from 'ws';
import { OPENAI_REALTIME } from '../config/openai-realtime';
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

// Helper function to safely convert any value to a displayable string
function safeArrayJoin(value: any, separator: string = ', '): string {
  if (!value) return 'None recorded';
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(separator) : 'None recorded';
  }
  if (typeof value === 'string') {
    return value || 'None recorded';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return 'None recorded';
    }
  }
  return String(value) || 'None recorded';
}

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
  
  // ========== Organization & Doctor Context ==========
  private organizationName: string = 'MediBridge 24/7';
  private primaryDoctorName: string = '';
  
  // Call logging
  private voiceCallId: string | null = null;
  private callStartTime: Date = new Date();
  private transcript: TranscriptEntry[] = [];

  constructor(twilioWs: WebSocket) {
    this.twilioWs = twilioWs;
    console.log('📞 TwilioMediaStreamHandler initialized');
  }

  // ========== Helper to get Organization Name ==========
  // Priority: clinic context > family member org > default
  private getOrganizationName(): string {
    // Try clinic context first (most reliable)
    if (this.patientContext?.clinicContext?.clinic?.name) {
      return this.patientContext.clinicContext.clinic.name;
    }
    // Try from family members
    if (this.familyMembers.length > 0 && this.familyMembers[0].organization_name) {
      return this.familyMembers[0].organization_name;
    }
    // Try from selected patient's org
    const selectedMember = this.familyMembers.find(m => m.patient_id === this.selectedPatientId);
    if (selectedMember?.organization_name) {
      return selectedMember.organization_name;
    }
    // Return stored org name or default
    return this.organizationName || 'MediBridge 24/7';
  }

  // ========== Get Primary Doctor from Prescriptions ==========
  private getPrimaryDoctorName(): string {
    if (this.patientContext?.smartContext?.prescriptions?.length > 0) {
      // Get the most recent prescription's doctor
      const recentRx = this.patientContext.smartContext.prescriptions[0];
      if (recentRx.doctor_name) {
        return recentRx.doctor_name;
      }
    }
    return '';
  }

  // ========== Get All Doctor Names from Prescriptions ==========
  private getDoctorNames(): string[] {
    const doctors = new Set<string>();
    if (this.patientContext?.smartContext?.prescriptions) {
      this.patientContext.smartContext.prescriptions.forEach((rx: any) => {
        if (rx.doctor_name) {
          doctors.add(rx.doctor_name);
        }
      });
    }
    return Array.from(doctors);
  }

  // ========== Get Clinic URL for WhatsApp Summary ==========
  private getClinicUrl(): string {
    if (this.patientContext?.clinicContext?.clinic?.subdomain) {
      return `https://${this.patientContext.clinicContext.clinic.subdomain}.medibridge24x7.com`;
    }
    if (this.patientContext?.clinicContext?.clinic?.slug) {
      return `https://patients.medibridge24x7.com/clinic/${this.patientContext.clinicContext.clinic.slug}`;
    }
    return 'https://patients.medibridge24x7.com';
  }

  // ========== Calculate Call Duration ==========
  private getCallDuration(): string {
    const now = new Date();
    const durationSeconds = Math.round((now.getTime() - this.callStartTime.getTime()) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // ========== Generate Conversation Summary for WhatsApp ==========
  private generateConversationSummary(): string {
    const points: string[] = [];
    
    // Get patient info
    const patientName = this.patientContext?.smartContext?.patient?.full_name || 
                        this.familyMembers.find(m => m.patient_id === this.selectedPatientId)?.full_name ||
                        this.callerName;
    
    if (patientName) {
      points.push(`Patient: ${patientName}`);
    }
    
    if (this.primaryDoctorName) {
      points.push(`Discussed prescriptions from Dr. ${this.primaryDoctorName}`);
    }
    
    const prescriptionCount = this.patientContext?.smartContext?.prescriptions?.length || 0;
    if (prescriptionCount > 0) {
      points.push(`Reviewed ${prescriptionCount} prescription(s)`);
    }
    
    // Add a summary of key topics from transcript (last few AI responses)
    const aiResponses = this.transcript.filter(t => t.role === 'ai').slice(-3);
    if (aiResponses.length > 0) {
      // Extract key topics mentioned
      const topicsDiscussed: string[] = [];
      aiResponses.forEach(response => {
        const text = response.text.toLowerCase();
        if (text.includes('medicine') || text.includes('tablet') || text.includes('dawai')) {
          topicsDiscussed.push('Medicines explained');
        }
        if (text.includes('dosage') || text.includes('dose') || text.includes('kitni')) {
          topicsDiscussed.push('Dosage instructions');
        }
        if (text.includes('side effect') || text.includes('reaction')) {
          topicsDiscussed.push('Side effects discussed');
        }
        if (text.includes('diet') || text.includes('food') || text.includes('khana')) {
          topicsDiscussed.push('Diet advice');
        }
      });
      
      // Add unique topics
      const uniqueTopics = [...new Set(topicsDiscussed)];
      if (uniqueTopics.length > 0) {
        points.push(`Topics: ${uniqueTopics.join(', ')}`);
      }
    }
    
    return points.length > 0 ? '• ' + points.join('\n• ') : 'General health consultation';
  }

  // ========== NEW: Send Post-Call WhatsApp Summary ==========
  private async sendPostCallWhatsAppSummary(): Promise<void> {
    try {
      // Only send if we have a valid phone number
      if (!this.callerPhone) {
        console.log('⚠️ No caller phone available for WhatsApp summary');
        return;
      }

      // Clean phone number
      let cleanPhone = this.callerPhone.replace(/[^\d]/g, '');
      if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
        cleanPhone = cleanPhone.substring(1);
      }
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }

      const webhookUrl = 'https://n8n.nhcare.in/webhook/medibridge-post-call-summary';
      
      const patientName = this.patientContext?.smartContext?.patient?.full_name || 
                          this.familyMembers.find(m => m.patient_id === this.selectedPatientId)?.full_name ||
                          this.callerName || 'Valued Patient';

      const payload = {
        phone_number: cleanPhone,
        organization_name: this.organizationName,
        organization_id: this.selectedOrganizationId,
        patient_name: patientName,
        caller_name: this.callerName,
        conversation_summary: this.generateConversationSummary(),
        clinic_url: this.getClinicUrl(),
        whatsapp_number: '+91 70421 91854',
        call_duration: this.getCallDuration(),
        primary_doctor: this.primaryDoctorName,
        prescriptions_count: this.patientContext?.smartContext?.prescriptions?.length || 0,
        call_sid: this.callSid,
        voice_call_id: this.voiceCallId,
        timestamp: new Date().toISOString()
      };

      console.log('📱 Sending post-call WhatsApp summary to:', cleanPhone);
      console.log('📋 Summary payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Source': 'medibridge-voice-server'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Post-call WhatsApp summary sent successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send post-call summary:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error sending post-call WhatsApp summary:', error);
      // Don't throw - this is a non-critical feature
    }
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
        
        // Set organization name early
        if (this.familyMembers.length > 0 && this.familyMembers[0].organization_name) {
          this.organizationName = this.familyMembers[0].organization_name;
          console.log('🏥 Organization:', this.organizationName);
        }
        
        // FIX: Use caller_patient_id (the person who owns this phone) not family_members[0]
        const callerPatientId = lookupResult.caller_patient_id;
        
        // Find the caller's patient record to get their org
        const callerRecord = this.familyMembers.find(m => m.patient_id === callerPatientId);
        
        if (callerRecord) {
          this.selectedPatientId = callerRecord.patient_id;
          this.selectedOrganizationId = callerRecord.organization_id;
          // Update org name from caller's record
          if (callerRecord.organization_name) {
            this.organizationName = callerRecord.organization_name;
          }
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
            organization_name: this.organizationName,
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
      console.log('🏥 Organization:', this.organizationName);
      await this.connectToOpenAI();

    } catch (error) {
      console.error('❌ Error initializing call:', error);
    }
  }

  private async loadPatientContext(patientId: string, organizationId: string): Promise<void> {
    try {
      console.log('📋 Loading context for patient:', patientId, 'org:', organizationId);
      
      // Try RPC first
      const { data: smartContext, error: smartError } = await supabase.rpc('get_patient_smart_context', {
        p_patient_id: patientId,
        p_query_type: 'prescription'
      });

      if (smartError) {
        console.error('❌ Smart context RPC error:', smartError.message);
      }

      // Log what we got
      console.log('📋 Smart context from RPC:', {
        patient: smartContext?.patient?.full_name || 'N/A',
        prescriptions: smartContext?.prescriptions?.length || 0
      });

      // FALLBACK: If RPC returns 0 prescriptions, fetch directly from database
      let prescriptionsData = smartContext?.prescriptions || [];
      
      if (prescriptionsData.length === 0) {
        console.log('⚠️ RPC returned 0 prescriptions, fetching directly from database...');
        
        // Fetch prescriptions directly
        const { data: directPrescriptions, error: rxError } = await supabase
          .from('prescriptions')
          .select(`
            id,
            doctor_name,
            diagnosis,
            created_at,
            prescription_date,
            clinic_name
          `)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (rxError) {
          console.error('❌ Direct prescriptions fetch error:', rxError.message);
        } else if (directPrescriptions && directPrescriptions.length > 0) {
          console.log(`✅ Found ${directPrescriptions.length} prescriptions directly`);
          
          // Fetch medicines for these prescriptions
          const prescriptionIds = directPrescriptions.map(p => p.id);
          const { data: medicines, error: medError } = await supabase
            .from('prescription_items')
            .select(`
              prescription_id,
              medicine_name,
              dosage,
              frequency,
              timing,
              duration,
              instructions
            `)
            .in('prescription_id', prescriptionIds);

          if (medError) {
            console.error('❌ Medicines fetch error:', medError.message);
          }

          // Combine prescriptions with their medicines
          prescriptionsData = directPrescriptions.map(rx => ({
            ...rx,
            medicines: medicines?.filter(m => m.prescription_id === rx.id) || []
          }));

          console.log(`✅ Loaded ${prescriptionsData.length} prescriptions with ${medicines?.length || 0} total medicines`);
        }
      }

      // Fetch patient details if not in smartContext
      let patientData = smartContext?.patient;
      if (!patientData) {
        const { data: directPatient } = await supabase
          .from('patients')
          .select('id, full_name, age, gender, blood_group, known_allergies, chronic_conditions, medical_history')
          .eq('id', patientId)
          .single();
        
        patientData = directPatient;
      }

      // Log final prescription details
      console.log('📋 Final context:', {
        patient: patientData?.full_name || 'N/A',
        prescriptions: prescriptionsData.length,
        prescriptionDetails: prescriptionsData.slice(0, 3).map((p: any) => ({
          doctor: p.doctor_name,
          diagnosis: p.diagnosis,
          medicines: p.medicines?.length || 0,
          medicineNames: p.medicines?.map((m: any) => m.medicine_name).join(', ') || 'N/A'
        }))
      });

      // Fetch clinic context
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
        
        // Update organization name from clinic context
        if (clinicContext?.clinic?.name) {
          this.organizationName = clinicContext.clinic.name;
        }
      }

      // Build final context
      this.patientContext = {
        ...this.patientContext,
        smartContext: {
          patient: patientData,
          prescriptions: prescriptionsData
        },
        clinicContext
      };

      // Set primary doctor name
      this.primaryDoctorName = this.getPrimaryDoctorName();
      console.log('👨‍⚕️ Primary Doctor:', this.primaryDoctorName || 'N/A');

      console.log('✅ Full patient context loaded with', prescriptionsData.length, 'prescriptions');
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

      const url = OPENAI_REALTIME.getWebSocketUrl();

      this.openaiWs = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      });

      this.openaiWs.on('open', () => {
        console.log('✅ Connected to OpenAI Realtime');
        this.isConnected = true;

        // Configure session with tools for patient selection (GA shape)
        const sessionConfig: any = {
          type: 'session.update',
          session: {
            type: 'realtime',
            model: OPENAI_REALTIME.MODEL,
            output_modalities: OPENAI_REALTIME.OUTPUT_MODALITIES,
            instructions: systemInstructions,
            audio: {
              input: {
                format: OPENAI_REALTIME.TWILIO_AUDIO_FORMAT,
                transcription: { model: OPENAI_REALTIME.TRANSCRIPTION_MODEL },
                turn_detection: OPENAI_REALTIME.TURN_DETECTION
              },
              output: {
                format: OPENAI_REALTIME.TWILIO_AUDIO_FORMAT,
                voice: OPENAI_REALTIME.VOICE
              }
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

  // ========== New User Instructions - Clinic Centric ==========
  private buildNewUserInstructions(): string {
    const orgName = this.getOrganizationName();
    
    return `You are Dr. Bridge, the AI health assistant for ${orgName}.

YOUR IDENTITY & GENDER:
- You are FEMALE - a warm, caring, professional Indian female assistant
- ALWAYS use feminine Hindi forms: "sakti hoon", "karti hoon", "hoon main", "mujhe pata hai"
- NEVER use male Hindi forms: "sakta", "karta", "hoon main" with male conjugation
- Think of yourself as a knowledgeable, friendly female clinic receptionist

You are on a VOICE CALL with a NEW CALLER who is not yet registered.

YOUR ROLE:
You are ${orgName}'s virtual assistant at the front desk. Think of yourself as a helpful receptionist who:
- Warmly welcomes new patients
- Collects their basic information
- Makes them feel comfortable with ${orgName}

GREETING (70% English, 30% Hindi):
"Hello! Welcome to ${orgName}. I'm Dr. Bridge, your health assistant here at the clinic. 
It looks like this is your first time calling us - wonderful to have you!
Main aapki kaise madad kar sakti hoon? How can I help you today?"

ENGAGEMENT WHILE COLLECTING INFO:
Keep the conversation warm and natural:
- "To help you better, may I have your good name please?"
- "Thank you! And your age please? This helps our doctors provide better care."
- "Perfect! And just for our records - male, female, or other?"
- "Wonderful! So I have [Name], [Age] years old, [Gender]. Is that correct?
   Great! I've registered you with ${orgName}. Ab aap humare family ka hissa hain!"

🚫 CRITICAL LIMITATIONS - WHAT YOU CANNOT DO:
❌ CANNOT send WhatsApp messages during this call (automatic summary sent after call ends)
❌ CANNOT book appointments directly (can share clinic contact number)
❌ CANNOT prescribe medications or diagnose conditions
❌ CANNOT process payments or billing
❌ CANNOT access external websites or real-time data

IF NEW USER WANTS TO UPLOAD A PRESCRIPTION:
"I'd be happy to help with your prescription! Please send a photo of it to our WhatsApp number: +91 70421 91854
After uploading, wait for 5 to 7 minutes and then call me back - main aapko sab kuch explain kar sakti hoon!"

RULES:
- Always represent ${orgName}, not yourself
- Be warm, welcoming - first impressions matter!
- Keep responses SHORT (2-3 sentences for voice)
- NEVER prescribe medications or diagnose
- For emergencies: "Please call 108 or visit ${orgName}'s emergency department immediately"
- Mix English and Hindi naturally (Hinglish)
- Remember: You are FEMALE - use feminine Hindi forms always`;
  }

  // ========== Patient Selection - Clinic Centric ==========
  private buildPatientSelectionInstructions(callerFirstName: string): string {
    const orgName = this.getOrganizationName();
    
    // Build family member list for the prompt
    const familyList = this.familyMembers.map((m, i) => {
      const ageGender = [m.age ? `${m.age} years` : null, m.gender].filter(Boolean).join(', ');
      return `${i + 1}. ${m.full_name} (${m.relationship})${ageGender ? ` - ${ageGender}` : ''}`;
    }).join('\n');

    return `You are Dr. Bridge, the AI health assistant for ${orgName}.

YOUR IDENTITY & GENDER:
- You are FEMALE - a warm, caring, professional Indian female assistant
- ALWAYS use feminine Hindi forms: "sakti hoon", "karti hoon", "de sakti hoon", "bata sakti hoon"
- NEVER use male Hindi forms: "sakta", "karta", "de sakta", "bata sakta"
- Your voice and personality: Like a knowledgeable, friendly female clinic receptionist

You are on a VOICE CALL. The caller is ${this.callerName}, a valued patient of ${orgName}, with ${this.familyMembers.length} family members registered.

YOUR ROLE:
You are ${orgName}'s virtual assistant at the front desk. You know this patient and their family.
Your job is to:
1. Warmly welcome them back to ${orgName}
2. Find out who they're calling about
3. Pull up the right records while keeping them engaged

GREETING (70% English, 30% Hindi):
"Hello ${callerFirstName}! Welcome back to ${orgName}. I'm Dr. Bridge, aapki health assistant.
Aap kaise hain? It's good to hear from you!
Yeh call kis ke liye hai - yourself ke liye, ya family mein kisi aur ke liye?"

REGISTERED FAMILY MEMBERS:
${familyList}

ENGAGEMENT WHILE THEY RESPOND:
If they hesitate or think:
- "Take your time! I have all your family's records here at ${orgName}."
- "I can see your whole family is registered with us - ${this.familyMembers.map(m => m.full_name).join(', ')}"

When they select someone:
- "Perfect! Let me pull up [Name]'s records from ${orgName}... just a moment."
- "Got it! Main [Name] ki prescription history load kar rahi hoon."

🚫 CRITICAL LIMITATIONS:
❌ CANNOT send WhatsApp messages during this call
❌ CANNOT book appointments directly
❌ CANNOT prescribe or diagnose

YOUR TASK:
1. Greet warmly with their name AND ${orgName}
2. Ask who the call is for
3. Listen and use 'select_patient' function
4. Keep them engaged while loading records

RULES:
- Always mention ${orgName} - you represent the clinic
- Be like a friendly female receptionist who knows them
- Keep responses SHORT (2-3 sentences)
- Wait for their response before proceeding
- NEVER prescribe or diagnose
- For emergencies: "Please come directly to ${orgName} or call 108"
- Remember: Use feminine Hindi forms (sakti, karti, rahi hoon)`;
  }

  // ========== Main Conversation - Full Clinic Context ==========
  private buildConversationInstructions(callerFirstName: string): string {
    const orgName = this.getOrganizationName();
    const doctorNames = this.getDoctorNames();
    const primaryDoctor = this.getPrimaryDoctorName();
    
    let patientInfo = '';
    let prescriptionInfo = '';
    let clinicInfo = '';
    let doctorContext = '';
    
    // Get the selected patient's name (might be different from caller)
    const selectedPatient = this.familyMembers.find(m => m.patient_id === this.selectedPatientId);
    const patientName = selectedPatient?.full_name || this.callerName;
    const patientFirstName = patientName?.split(' ')[0] || 'there';
    
    try {
      if (this.patientContext?.smartContext) {
        const sc = this.patientContext.smartContext;
        
        // Use safe array join helper for all array fields
        const allergies = safeArrayJoin(sc.patient?.known_allergies || sc.patient?.medical_history?.allergies);
        const chronicConditions = safeArrayJoin(sc.patient?.chronic_conditions || sc.patient?.medical_history?.chronic_conditions);
        
        patientInfo = `
PATIENT INFORMATION:
- Name: ${sc.patient?.full_name || patientName}
- Age: ${sc.patient?.age || 'Not specified'}
- Gender: ${sc.patient?.gender || 'Not specified'}
- Blood Group: ${sc.patient?.blood_group || 'Not specified'}
- Allergies: ${allergies}
- Chronic Conditions: ${chronicConditions}`;

        if (sc.prescriptions && sc.prescriptions.length > 0) {
          prescriptionInfo = `

PRESCRIPTIONS ON FILE: ${sc.prescriptions.length}
${sc.prescriptions.slice(0, 5).map((rx: any, i: number) => {
  const medicineList = rx.medicines && rx.medicines.length > 0
    ? rx.medicines.map((m: any) => `${m.medicine_name || 'Unknown'} (${m.dosage || 'as directed'})`).join(', ')
    : 'See prescription details';
  
  return `
📋 Prescription ${i + 1}:
   - Doctor: Dr. ${rx.doctor_name || 'Unknown'} at ${orgName}
   - Date: ${rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-IN') : rx.prescription_date || 'N/A'}
   - Diagnosis: ${rx.diagnosis || 'General consultation'}
   - Medicines: ${medicineList}`;
}).join('')}`;

          // Build doctor context for conversation
          if (doctorNames.length > 0) {
            doctorContext = `

DOCTORS WHO HAVE TREATED THIS PATIENT AT ${orgName.toUpperCase()}:
${doctorNames.map(d => `- Dr. ${d}`).join('\n')}
Most Recent: Dr. ${primaryDoctor || doctorNames[0]}

USE THIS TO BUILD RAPPORT:
- "I see Dr. ${primaryDoctor || doctorNames[0]} prescribed this for you..."
- "According to Dr. ${primaryDoctor || doctorNames[0]}'s prescription..."
- "Your doctor at ${orgName} has recommended..."`;
          }
        } else {
          prescriptionInfo = `

PRESCRIPTIONS: No prescriptions found for this patient.
Offer to help them upload:
- "I don't see any prescriptions on file yet. Would you like to upload one?"
- "You can send your prescription photo to our WhatsApp: +91 70421 91854"
- "If you have a prescription from ${orgName}, I can help explain it once you upload it."`;
        }
      }

      if (this.patientContext?.clinicContext) {
        const cc = this.patientContext.clinicContext;
        const doctorsList = cc.doctors && cc.doctors.length > 0
          ? cc.doctors.slice(0, 5).map((d: any) => 
              `- Dr. ${d.full_name || d.name || 'Unknown'} (${d.specialization || 'General'}) - ₹${d.consultation_fee || 'Contact clinic'}`
            ).join('\n')
          : 'Contact clinic for doctor information';
        
        clinicInfo = `

CLINIC: ${orgName}
${cc.clinic?.tagline || 'Your trusted healthcare partner'}

AVAILABLE DOCTORS:
${doctorsList}`;
      }
    } catch (error) {
      console.error('⚠️ Error building patient info:', error);
    }

    // Determine if caller is calling for self or someone else
    const isCallingForSelf = this.selectedPatientId === this.patientContext?.callerPatientId;
    const relationshipNote = isCallingForSelf 
      ? '' 
      : `
IMPORTANT: ${callerFirstName} is calling on behalf of ${patientFirstName}.
- Address medical info about ${patientFirstName}
- But speak to ${callerFirstName}
- Example: "For ${patientFirstName}, Dr. ${primaryDoctor || 'your doctor'} has prescribed..."`;

    const prescriptionCount = this.patientContext?.smartContext?.prescriptions?.length || 0;

    return `You are Dr. Bridge, the AI health assistant for ${orgName}.

YOUR IDENTITY & GENDER:
- You are FEMALE - a warm, caring, professional Indian female assistant
- ALWAYS use feminine Hindi forms: "sakti hoon", "karti hoon", "de sakti hoon", "bata sakti hoon", "samajh sakti hoon"
- NEVER use male Hindi forms: "sakta", "karta", "de sakta", "bata sakta", "samajh sakta"
- Your personality: Like a knowledgeable, friendly female clinic receptionist who genuinely cares
- When referring to yourself in Hindi, ALWAYS use feminine conjugation

YOUR ROLE:
You are ${orgName}'s virtual assistant - like a knowledgeable receptionist who:
- Knows all the patients and their history
- Can explain prescriptions and medicines
- Represents ${orgName} and its doctors
- Helps patients between their clinic visits

You are NOT a replacement for doctors - you SUPPORT the doctors at ${orgName}.
${relationshipNote}
${patientInfo}
${doctorContext}
${prescriptionInfo}
${clinicInfo}

GREETING (70% English, 30% Hindi):
"${isCallingForSelf 
  ? `Perfect ${patientFirstName}! I have all your records from ${orgName} ready. ${prescriptionCount > 0 ? `Aapki ${prescriptionCount} prescriptions hain mere paas${primaryDoctor ? `, including the recent one from Dr. ${primaryDoctor}` : ''}.` : ''} How can I help you today?`
  : `Got it ${callerFirstName}! I have ${patientFirstName}'s records from ${orgName} ready. ${prescriptionCount > 0 ? `Unki ${prescriptionCount} prescriptions hain mere paas${primaryDoctor ? `, including Dr. ${primaryDoctor}'s recent prescription` : ''}.` : ''} How can I help with ${patientFirstName}'s health today?`
}"

HOW TO REFERENCE DOCTORS & CLINIC:
ALWAYS attribute information to the doctors and ${orgName}:
GOOD: "According to Dr. ${primaryDoctor || '[Doctor]'}'s prescription from ${orgName}..."
GOOD: "Dr. ${primaryDoctor || '[Doctor]'} has prescribed this because..."
GOOD: "At ${orgName}, we recommend..."
BAD: "I think you should take..." (NEVER say this)
BAD: "You should try..." (NEVER say this)

ENGAGEMENT & SMALL TALK:
WHILE LOOKING UP INFO:
- "Let me check that for you... I see Dr. ${primaryDoctor || '[Doctor]'} prescribed this on [date]..."
- "Just pulling up those details... Ah yes, here it is..."

BUILDING RAPPORT:
- "How have you been feeling since your last visit to ${orgName}?"
- "Are you following Dr. ${primaryDoctor || '[Doctor]'}'s advice?"
- "Is the medicine helping? Any side effects?"

✅ WHAT YOU CAN HELP WITH:
✅ Explain medicines prescribed by ${orgName}'s doctors
✅ Clarify dosage, timing, and instructions
✅ Explain why a medicine was prescribed
✅ Describe potential side effects
✅ Guide patients to upload new prescriptions/reports (via WhatsApp or website)
✅ Provide general health advice and lifestyle guidance
✅ Share clinic contact information

🚫 CRITICAL LIMITATIONS - WHAT YOU CANNOT DO:
❌ NEVER prescribe new medications
❌ NEVER diagnose new conditions  
❌ NEVER change doctor's instructions
❌ CANNOT send WhatsApp messages during this call (patient gets automatic summary after call ends)
❌ CANNOT book appointments directly (guide them to call clinic)
❌ CANNOT process payments or billing
❌ CANNOT access external websites or real-time internet data

🎯 WHEN PATIENT ASKS YOU TO DO SOMETHING YOU CANNOT:

If asked to send WhatsApp message:
"Main is call ke dauraan WhatsApp message nahi bhej sakti, but don't worry! Jab humari call khatam hogi, aapko automatically ek summary message aayega WhatsApp pe with everything we discussed and the clinic website link."

If asked to book appointment:
"Main directly appointment book nahi kar sakti, but main aapko clinic ka number de sakti hoon. Would you like ${orgName}'s contact number?"

If asked to prescribe medicine:
"Main medicines prescribe nahi kar sakti - that's only for Dr. ${primaryDoctor || 'your doctor'}. But I can explain the medicines already prescribed for you. Shall I do that?"

If asked about something not in patient records:
"Mere paas ye information nahi hai, but aap ${orgName} ko contact kar sakte hain for more details."

EMERGENCY HANDLING:
If patient mentions chest pain, breathing difficulty, severe symptoms:
"This sounds like an emergency. Please call 108 right away or go to ${orgName}'s emergency department immediately. 
Yeh emergency hai - please abhi 108 call karein ya hospital jaayein. Aapki health sabse pehle hai - mujhe baad mein call kar lena!"

DOCUMENT UPLOAD GUIDANCE:
If patient wants to share/upload a new prescription, lab report, or any document:

TRIGGER PHRASES (patient might say):
- "I want to upload/share a prescription"
- "I have a new report to share"
- "Mujhe prescription bhejni hai"
- "How do I send my lab report?"
- "I got a new prescription from doctor"
- "Can I share my test results?"

YOUR RESPONSE:
"I'd love to help you with your new prescription/report! Since this is a voice call, I can't receive files directly. But don't worry, it's very easy:

Option 1 - WhatsApp (Fastest):
Send your prescription or report photo to our WhatsApp number: +91 70421 91854
Bas photo click karke WhatsApp pe bhej dijiye.

Option 2 - Website:
You can also visit ${orgName}'s patient portal to upload documents.

After uploading, please wait for 5 to 7 minutes for our system to process it, and then call me back. Main aapki nayi prescription ke baare mein detail mein baat kar sakti hoon!

Would you like me to repeat the WhatsApp number?"

IF THEY ASK TO REPEAT:
"Sure! The WhatsApp number is: +91 7-0-4-2-1-9-1-8-5-4. That's +91 70421 91854.
Photo bhejne ke baad 5-7 minutes wait karein aur phir mujhe call karein!"

POST-CALL SUMMARY REMINDER:
When ending the call, you can mention:
"Aapko call ke baad ek WhatsApp message aayega with everything we discussed today. Usme clinic website ka link bhi hoga for future reference."

CALL WRAP-UP:
- "Is there anything else I can help you with today?"
- "Remember, ${orgName} is always here for you. Take care!"
- "Dr. ${primaryDoctor || 'Your doctor'} and the team at ${orgName} wish you good health!"

VOICE CALL GUIDELINES:
1. Keep responses SHORT (2-3 sentences)
2. Be warm and empathetic
3. Always reference ${orgName} and its doctors
4. Mix Hindi and English naturally (Hinglish)
5. Match the patient's language preference
6. Remember: You are FEMALE - ALWAYS use feminine Hindi forms (sakti, karti, hoon with feminine context)`;
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
          text: 'The call has just connected. Please greet the caller appropriately based on your instructions. Remember to mention the clinic name and be warm and welcoming. Remember you are a FEMALE assistant - use feminine Hindi forms.'
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
      case 'response.output_audio.delta':
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
          case 'response.output_audio.done':
            console.log('🔊 AI audio response complete');
            break;
    
          case 'response.audio_transcript.done':
          case 'response.output_audio_transcript.done':
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
        const selfIndicators = ['for me', 'myself', 'mera', 'mere liye', 'khud', 'self', 'apne liye', 'main', 'mujhe', 'apna'];
        const callerFirstName = this.callerName?.toLowerCase().split(' ')[0] || '';
        const callerFullNameLower = this.callerName?.toLowerCase() || '';
        
        const isSelfSelection = selfIndicators.some(indicator => patientName.includes(indicator)) ||
                               patientName.includes(callerFirstName) ||
                               patientName.includes(callerFullNameLower);
        
        if (isSelfSelection && this.patientContext?.callerPatientId) {
          // User is selecting themselves - use the caller's patient record directly
          console.log('👤 Self-selection detected, using caller_patient_id:', this.patientContext.callerPatientId);
          selectedMember = this.familyMembers.find(m => m.patient_id === this.patientContext.callerPatientId);
          
          // If not found in family list (edge case), create from context
          if (!selectedMember) {
            const callerOrg = this.familyMembers.length > 0 ? this.familyMembers[0].organization_id : '';
            selectedMember = {
              patient_id: this.patientContext.callerPatientId,
              full_name: this.callerName,
              relationship: 'self',
              organization_id: callerOrg,
              organization_name: this.organizationName,
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
          
          // Update org name if available
          if (selectedMember.organization_name) {
            this.organizationName = selectedMember.organization_name;
          }
          
          // Load the selected patient's context
          await this.loadPatientContext(selectedMember.patient_id, selectedMember.organization_id);
          
          // Update call state
          this.callState = 'CONVERSATION';
          
          // Update voice call record with org name and doctor
          if (this.voiceCallId) {
            await supabase
              .from('voice_calls')
              .update({
                patient_id: selectedMember.patient_id,
                organization_id: selectedMember.organization_id,
                metadata: {
                  original_phone: this.callerPhone,
                  patient_name: selectedMember.full_name,
                  organization_name: this.organizationName,
                  selected_by: this.callerName,
                  call_state: this.callState,
                  primary_doctor: this.primaryDoctorName
                }
              })
              .eq('id', this.voiceCallId);
          }

          // Build new instructions with loaded context
          let newInstructions: string;
          try {
            newInstructions = this.buildConversationInstructions(this.callerName.split(' ')[0]);
          } catch (instructionError) {
            console.error('⚠️ Error building instructions, using fallback:', instructionError);
            const orgName = this.getOrganizationName();
            newInstructions = `You are Dr. Bridge, a FEMALE AI health assistant for ${orgName}. 
              You are now helping ${selectedMember.full_name}. 
              I have ${this.patientContext?.smartContext?.prescriptions?.length || 0} prescriptions loaded. 
              Be helpful, always mention ${orgName}, and answer questions about their medicines and health.
              Remember: You are FEMALE - use feminine Hindi forms (sakti hoon, karti hoon).`;
          }
          
          // Update OpenAI session with new instructions (GA shape)
          this.openaiWs?.send(JSON.stringify({
            type: 'session.update',
            session: {
              type: 'realtime',
              instructions: newInstructions,
              tools: [] // Remove tools after selection
            }
          }));

          // Send function result with engagement message
          const orgName = this.getOrganizationName();
          const prescriptionCount = this.patientContext?.smartContext?.prescriptions?.length || 0;
          const primaryDoc = this.getPrimaryDoctorName();
          
          this.openaiWs?.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: message.call_id,
              output: JSON.stringify({
                success: true,
                patient_name: selectedMember.full_name,
                organization_name: orgName,
                prescriptions_count: prescriptionCount,
                primary_doctor: primaryDoc,
                message: `Records loaded for ${selectedMember.full_name} from ${orgName}. Found ${prescriptionCount} prescriptions${primaryDoc ? `, most recent from Dr. ${primaryDoc}` : ''}.`
              })
            }
          }));

          // Trigger response
          this.openaiWs?.send(JSON.stringify({ type: 'response.create' }));

        } else {
          console.log('⚠️ Could not find matching patient');
          
          const orgName = this.getOrganizationName();
          this.openaiWs?.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: message.call_id,
              output: JSON.stringify({
                success: false,
                error: 'Could not find matching patient',
                available_patients: this.familyMembers.map(m => m.full_name),
                message: `I couldn't find that name. The family members registered with ${orgName} are: ${this.familyMembers.map(m => m.full_name).join(', ')}. Which one would you like help with?`
              })
            }
          }));

          this.openaiWs?.send(JSON.stringify({ type: 'response.create' }));
        }
      } catch (error) {
        console.error('❌ Error handling function call:', error);
        
        // Send error response to OpenAI so conversation can continue
        this.openaiWs?.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: message.call_id,
            output: JSON.stringify({
              success: false,
              error: 'An error occurred while processing your selection. Please try again.',
              message: 'I had a small technical hiccup. Could you please tell me again who this call is for?'
            })
          }
        }));

        this.openaiWs?.send(JSON.stringify({ type: 'response.create' }));
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
            organization_name: this.organizationName,
            caller_name: this.callerName,
            primary_doctor: this.primaryDoctorName,
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
        console.log(`🏥 Organization: ${this.organizationName}`);
        console.log(`👨‍⚕️ Primary Doctor: ${this.primaryDoctorName || 'N/A'}`);
      }

      // ========== NEW: Send Post-Call WhatsApp Summary ==========
      // Only send if call had meaningful interaction (at least 2 transcript entries)
      if (this.transcript.length >= 2 && durationSeconds >= 30) {
        console.log('📱 Triggering post-call WhatsApp summary...');
        await this.sendPostCallWhatsAppSummary();
      } else {
        console.log('⏭️ Skipping WhatsApp summary (short call or no interaction)');
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