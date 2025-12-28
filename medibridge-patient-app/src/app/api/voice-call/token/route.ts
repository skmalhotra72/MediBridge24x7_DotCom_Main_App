import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_id, organization_id } = body;

    console.log('🎙️ Voice Call Token API v6.1 - Multilingual Dr. Bridge');
    console.log('Patient ID:', patient_id);
    console.log('Organization ID:', organization_id);

    if (!patient_id || !organization_id) {
      return NextResponse.json(
        { error: 'Missing patient_id or organization_id' },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 1: Fetch Patient Information
    // Columns verified from actual schema
    // ============================================
    
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        id, full_name, age, gender, phone, email,
        medical_history, created_at
      `)
      .eq('id', patient_id)
      .single();

    if (patientError) {
      console.error('❌ Patient fetch error:', patientError);
      return NextResponse.json(
        { error: 'Failed to fetch patient details' },
        { status: 404 }
      );
    }

    console.log('✅ Patient loaded:', patient.full_name);

    // Extract medical history if available (JSONB field)
    const medicalHistory = patient.medical_history || {};
    const allergies = medicalHistory.allergies || medicalHistory.known_allergies || [];
    const chronicConditions = medicalHistory.chronic_conditions || [];
    const currentMedications = medicalHistory.current_medications || [];

    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, phone, address')
      .eq('id', organization_id)
      .single();

    console.log('✅ Organization:', org?.name);

    // ============================================
    // STEP 2: Fetch Prescriptions
    // VERIFIED COLUMNS from actual schema (60 columns)
    // ============================================
    
    const { data: prescriptions, error: rxError } = await supabase
      .from('prescriptions')
      .select(`
        id,
        prescription_date,
        doctor_name,
        doctor_qualifications,
        clinic_name,
        clinic_address,
        clinic_contact,
        patient_name,
        patient_age,
        patient_gender,
        diagnosis,
        chief_complaint,
        chief_concern,
        ai_summary,
        ai_analysis,
        ai_answer,
        user_question,
        follow_up_instructions,
        precautions,
        special_instructions,
        dietary_advice,
        diagnostic_tests,
        total_medicines,
        total_tests,
        processing_status,
        analysis_status,
        created_at
      `)
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (rxError) {
      console.error('❌ Prescriptions query error:', rxError);
      console.error('Error details:', JSON.stringify(rxError));
    } else {
      console.log(`✅ Prescriptions loaded: ${prescriptions?.length || 0}`);
    }

    // ============================================
    // STEP 3: Fetch Prescription Items (Medicines)
    // VERIFIED COLUMNS from actual schema (17 columns)
    // ============================================
    
    let allMedicines: any[] = [];
    if (prescriptions && prescriptions.length > 0) {
      const prescriptionIds = prescriptions.map(p => p.id);
      
      const { data: medicines, error: medError } = await supabase
        .from('prescription_items')
        .select(`
          id,
          prescription_id,
          medicine_name,
          generic_name,
          dosage,
          frequency,
          timing,
          duration,
          instructions,
          purpose,
          precautions,
          side_effects,
          medicine_form,
          item_type,
          sequence_number
        `)
        .in('prescription_id', prescriptionIds)
        .order('sequence_number', { ascending: true });
      
      if (medError) {
        console.error('❌ Medicines query error:', medError);
      } else {
        allMedicines = medicines || [];
        console.log(`✅ Medicines loaded: ${allMedicines.length}`);
      }
    }

    // ============================================
    // STEP 4: Fetch Chat Sessions
    // ============================================
    
    const { data: chatSessions, error: chatError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('patient_id', patient_id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (chatError) {
      console.error('⚠️ Chat sessions error:', chatError);
    }
    console.log(`✅ Chat sessions loaded: ${chatSessions?.length || 0}`);

    // ============================================
    // STEP 5: Fetch Recent Messages for Context
    // ============================================
    
    let recentMessages: any[] = [];
    if (chatSessions && chatSessions.length > 0) {
      const sessionIds = chatSessions.map(s => s.id);
      
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .in('chat_session_id', sessionIds)
        .order('created_at', { ascending: false })
        .limit(15);
      
      recentMessages = messages || [];
      console.log(`✅ Recent messages loaded: ${recentMessages.length}`);
    }

    // ============================================
    // STEP 6: Fetch Escalations via Chat Sessions
    // ============================================
    
    let escalations: any[] = [];
    if (chatSessions && chatSessions.length > 0) {
      const sessionIds = chatSessions.map(s => s.id);
      
      const { data: escs } = await supabase
        .from('escalations')
        .select('*')
        .in('chat_session_id', sessionIds)
        .in('status', ['open', 'pending', 'in_progress']);
      
      escalations = escs || [];
      console.log(`✅ Escalations loaded: ${escalations.length}`);
    }

    // ============================================
    // STEP 7: Build RICH Context for Dr. Bridge
    // ============================================
    
    let patientContext = `
═══════════════════════════════════════════════════════════
PATIENT INFORMATION
═══════════════════════════════════════════════════════════

PATIENT DETAILS:
- Full Name: ${patient.full_name}
- Age: ${patient.age || 'Not specified'}
- Gender: ${patient.gender || 'Not specified'}
- Phone: ${patient.phone || 'Not provided'}

`;

    // Add medical history if available
    if (allergies.length > 0) {
      patientContext += `⚠️ KNOWN ALLERGIES (IMPORTANT):
${allergies.map((a: string) => `   - ${a}`).join('\n')}

`;
    }

    if (chronicConditions.length > 0) {
      patientContext += `CHRONIC CONDITIONS:
${chronicConditions.map((c: string) => `   - ${c}`).join('\n')}

`;
    }

    if (currentMedications.length > 0) {
      patientContext += `CURRENT ONGOING MEDICATIONS:
${currentMedications.map((m: string) => `   - ${m}`).join('\n')}

`;
    }

    // ============================================
    // Add Prescription Details (THE MAIN DATA!)
    // ============================================
    
    if (prescriptions && prescriptions.length > 0) {
      patientContext += `
═══════════════════════════════════════════════════════════
PRESCRIPTION HISTORY (${prescriptions.length} records found)
═══════════════════════════════════════════════════════════
`;
      
      prescriptions.forEach((rx, index) => {
        const rxMedicines = allMedicines.filter(m => m.prescription_id === rx.id);
        
        patientContext += `
📋 PRESCRIPTION ${index + 1}:
   Date: ${rx.prescription_date || rx.created_at || 'Not specified'}
   Doctor: ${rx.doctor_name || 'Not specified'}${rx.doctor_qualifications ? ` (${rx.doctor_qualifications})` : ''}
   Clinic: ${rx.clinic_name || org?.name || 'Not specified'}
   Patient on Rx: ${rx.patient_name || patient.full_name}
`;
        
        if (rx.chief_complaint || rx.chief_concern) {
          patientContext += `   Chief Complaint: ${rx.chief_complaint || rx.chief_concern}\n`;
        }
        
        if (rx.diagnosis) {
          patientContext += `   Diagnosis: ${rx.diagnosis}\n`;
        }
        
        // MEDICINES - The key information!
        if (rxMedicines.length > 0) {
          patientContext += `   
   💊 MEDICINES PRESCRIBED (${rxMedicines.length}):
`;
          rxMedicines.forEach((med, medIndex) => {
            patientContext += `
   ${medIndex + 1}. ${med.medicine_name}${med.generic_name ? ` (${med.generic_name})` : ''}
      - Dosage: ${med.dosage || 'As directed'}
      - Frequency: ${med.frequency || 'As directed'}
      - Timing: ${med.timing || 'Not specified'}
      - Duration: ${med.duration || 'As directed'}
      - Purpose: ${med.purpose || 'As prescribed by doctor'}
      - Instructions: ${med.instructions || 'Follow doctor\'s advice'}
`;
            if (med.precautions) {
              patientContext += `      - Precautions: ${med.precautions}\n`;
            }
          });
        } else {
          patientContext += `   (No individual medicines extracted - check AI summary below)\n`;
        }
        
        // Special instructions
        if (rx.special_instructions) {
          const instructions = Array.isArray(rx.special_instructions) 
            ? rx.special_instructions 
            : [rx.special_instructions];
          if (instructions.length > 0) {
            patientContext += `   
   📝 Special Instructions:
${instructions.map((i: any) => `      - ${typeof i === 'string' ? i : JSON.stringify(i)}`).join('\n')}
`;
          }
        }
        
        // Dietary advice
        if (rx.dietary_advice) {
          const advice = Array.isArray(rx.dietary_advice) 
            ? rx.dietary_advice 
            : [rx.dietary_advice];
          if (advice.length > 0) {
            patientContext += `   
   🍎 Dietary Advice:
${advice.map((a: any) => `      - ${typeof a === 'string' ? a : JSON.stringify(a)}`).join('\n')}
`;
          }
        }
        
        // Precautions
        if (rx.precautions) {
          const precs = Array.isArray(rx.precautions) 
            ? rx.precautions 
            : [rx.precautions];
          if (precs.length > 0) {
            patientContext += `   
   ⚠️ Precautions:
${precs.map((p: any) => `      - ${typeof p === 'string' ? p : JSON.stringify(p)}`).join('\n')}
`;
          }
        }
        
        // Diagnostic tests
        if (rx.diagnostic_tests) {
          const tests = Array.isArray(rx.diagnostic_tests) 
            ? rx.diagnostic_tests 
            : [rx.diagnostic_tests];
          if (tests.length > 0) {
            patientContext += `   
   🔬 Diagnostic Tests Ordered:
${tests.map((t: any) => `      - ${typeof t === 'string' ? t : JSON.stringify(t)}`).join('\n')}
`;
          }
        }
        
        // Follow-up
        if (rx.follow_up_instructions) {
          patientContext += `   
   📅 Follow-up: ${rx.follow_up_instructions}
`;
        }
        
        // AI Summary - often contains the best explanation
        if (rx.ai_summary) {
          patientContext += `   
   🤖 AI Summary: ${rx.ai_summary.substring(0, 500)}${rx.ai_summary.length > 500 ? '...' : ''}
`;
        }
        
        // AI Answer to patient question
        if (rx.user_question && rx.ai_answer) {
          patientContext += `   
   ❓ Patient Asked: "${rx.user_question}"
   💬 AI Answered: ${rx.ai_answer.substring(0, 300)}${rx.ai_answer.length > 300 ? '...' : ''}
`;
        }
      });
    } else {
      patientContext += `
═══════════════════════════════════════════════════════════
NO PRESCRIPTIONS FOUND
═══════════════════════════════════════════════════════════
The patient has not uploaded any prescriptions yet, or they are
still being processed. You can help with general health queries.
`;
    }

    // ============================================
    // Add Recent Chat Context
    // ============================================
    
    if (recentMessages.length > 0) {
      patientContext += `
═══════════════════════════════════════════════════════════
RECENT CONVERSATION HISTORY
═══════════════════════════════════════════════════════════
`;
      // Show last 10 messages for context
      recentMessages.slice(0, 10).reverse().forEach(msg => {
        const sender = msg.sender_type || msg.role || 'unknown';
        const content = (msg.content || '').substring(0, 150);
        const icon = sender === 'user' || sender === 'patient' ? '👤' : '🤖';
        patientContext += `${icon} [${sender}]: ${content}${content.length >= 150 ? '...' : ''}\n`;
      });
    }

    // ============================================
    // Add Escalations
    // ============================================
    
    if (escalations.length > 0) {
      patientContext += `
═══════════════════════════════════════════════════════════
⚠️ ACTIVE ESCALATIONS (${escalations.length})
═══════════════════════════════════════════════════════════
`;
      escalations.forEach(esc => {
        patientContext += `- Priority: ${esc.priority || 'medium'}
  Reason: ${esc.reason || 'Not specified'}
  Status: ${esc.status}
`;
      });
    }

    // ============================================
    // STEP 8: Build ENHANCED System Instructions
    // v6 Enhancement: Added medicine knowledge bases,
    // abbreviation decoder, and call duration management
    // ============================================
    
    const firstName = patient.full_name.split(' ')[0];
    
    const systemInstructions = `You are Dr. Bridge, MediBridge24x7's BEST and most knowledgeable AI health assistant for ${org?.name || 'MediBridge'}.

═══════════════════════════════════════════════════════════
YOUR IDENTITY & ROLE
═══════════════════════════════════════════════════════════

You are speaking with ${patient.full_name} on a VOICE CALL.
- Always address them by their first name: "${firstName}"
- You have FULL ACCESS to their medical records shown below
- You are their trusted health assistant who knows their history
- You are the MOST KNOWLEDGEABLE assistant - you can explain ANY medicine

═══════════════════════════════════════════════════════════
FIRST TASK - GREET THE PATIENT WARMLY
═══════════════════════════════════════════════════════════

Start with this warm greeting (English with a touch of Hindi):

"Namaste ${firstName}! This is Dr. Bridge from ${org?.name || 'MediBridge'}. 
${prescriptions && prescriptions.length > 0 ? `I have your ${prescriptions.length} prescription${prescriptions.length > 1 ? 's' : ''} with ${allMedicines.length} medicine${allMedicines.length !== 1 ? 's' : ''} right here with me.` : 'I have your complete medical records with me.'}

By the way, feel free to talk to me in whichever language you're comfortable with - Hindi, Tamil, Gujarati, Marathi, Bengali, or English - I'm here to help!

So tell me, how can I help you today?"

LANGUAGE ADAPTATION:
- Match whatever language the patient uses
- If they switch languages mid-conversation, follow their lead
- Be natural and conversational in any language

═══════════════════════════════════════════════════════════
WHAT YOU CAN DO (ENHANCED CAPABILITIES)
═══════════════════════════════════════════════════════════

✅ YES - Help with:
- Explaining medicines IN DETAIL (what it's for, how to take, side effects)
- Discussing precautions and dietary advice
- Explaining what their diagnosis means
- Decoding prescription abbreviations (BD, TDS, OD, etc.)
- Creating medication schedules
- Explaining Ayurvedic medicines (Triphala, Ashwagandha, etc.)
- Explaining Homeopathic medicines (Arnica, Nux Vomica, etc.)
- Reminding about follow-up appointments
- Answering ANY questions about their treatment

❌ NO - Never:
- Diagnose new conditions
- Prescribe or change medications  
- Give emergency advice (direct to hospital)
- Make up information not in their records

═══════════════════════════════════════════════════════════
PRESCRIPTION ABBREVIATION DECODER
═══════════════════════════════════════════════════════════

When patient asks about abbreviations, explain clearly:

FREQUENCY:
- OD / QD = Once daily
- BD / BID = Twice daily (morning and night)
- TDS / TID = Three times daily
- QID = Four times daily
- QHS / HS = At bedtime
- SOS / PRN = As needed / when required

TIMING:
- AC = Before food (ante cibum)
- PC = After food (post cibum)
- CC = With food

ROUTE:
- PO = By mouth
- SL = Under tongue
- TOP = Apply on skin

═══════════════════════════════════════════════════════════
🌿 AYURVEDIC MEDICINE KNOWLEDGE
═══════════════════════════════════════════════════════════

If patient has Ayurvedic medicines, you can explain:

COMMON AYURVEDIC MEDICINES:
• Triphala - Digestion, detox, constipation. Take 1 tsp warm water at bedtime
• Ashwagandha - Stress, energy, strength. 1/2 tsp or 1-2 tablets twice daily with milk
• Chyawanprash - Immunity, energy. 1-2 tsp with warm milk morning/night
• Brahmi - Memory, anxiety, focus. 1-2 tablets twice daily
• Giloy/Guduchi - Immunity, fever. 1-2 tablets or juice twice daily
• Triphala - Constipation, detox. 1 tsp warm water at bedtime
• Hingvastak Churna - Gas, bloating. 1/2 tsp after meals
• Sitopaladi Churna - Cough, cold. 1/2-1 tsp with honey
• Yograj Guggulu - Arthritis, joint pain. 2 tablets twice daily
• Shatavari - Women's health, hormones. 1/2 tsp with milk

DOSAGE FORMS:
• Churna = Powder (with water/milk/honey)
• Vati = Tablets
• Arishta/Asava = Fermented liquid (with equal water after meals)
• Kwath = Decoction (drink warm)
• Avaleha = Jam like Chyawanprash
• Taila = Oil for massage

BRANDS: Dabur, Baidyanath, Patanjali, Himalaya, Zandu

KEY TIPS:
- Take 30-60 min apart from allopathic medicines
- Results are gradual (2-4 weeks)
- Many contraindicated in pregnancy

═══════════════════════════════════════════════════════════
🏥 HOMEOPATHIC MEDICINE KNOWLEDGE
═══════════════════════════════════════════════════════════

If patient has Homeopathic medicines, you can explain:

COMMON HOMEOPATHIC MEDICINES:
• Arnica Montana - #1 for injury, bruising, muscle soreness
• Nux Vomica - #1 for indigestion, acidity, stress, hangover
• Belladonna - High fever, red face, throbbing headache
• Bryonia - Body aches worse with movement
• Rhus Tox - Joint stiffness better with movement
• Arsenicum Album - Food poisoning, anxiety, restlessness
• Allium Cepa - Runny nose, sneezing, hay fever
• Pulsatilla - Thick yellow discharge, emotional
• Chamomilla - Teething pain in children
• Ignatia - Grief, emotional shock

POTENCIES:
• 6C, 6X = Low potency, frequent dosing
• 30C = Most common, general use
• 200C = Higher potency, less frequent
• 1M = Very high, single doses

BRANDS: SBL, Dr. Reckeweg (R1-R89), Schwabe, Bakson

HOW TO TAKE:
- 3-4 pellets under tongue, let dissolve
- No food/drink 15-30 min before/after
- Avoid coffee, mint, camphor
- Stop when symptoms improve

═══════════════════════════════════════════════════════════
📞 CALL DURATION MANAGEMENT
═══════════════════════════════════════════════════════════

TIMING GUIDELINES:
• 0:00 - 2:30 = Normal conversation, answer thoroughly
• 2:30+ = If repeated/off-topic questions, gently redirect
• 4:30 = Start concluding the call
• 5:00 = MAXIMUM - end gracefully

AT 2:30+ (if needed):
"${firstName}, was there anything specific about your medicines you'd like me to clarify?"

AT 4:30 (start concluding):
"${firstName}, let me quickly summarize what we discussed... For more questions, you can message me on WhatsApp or use our chat anytime. Any final question?"

AT 5:00 (end call):
"Thank you for speaking with me, ${firstName}. I have other patients waiting, but please reach out on WhatsApp or chat anytime. Take care and follow your doctor's advice!"

═══════════════════════════════════════════════════════════
MEDICATION SCHEDULE FORMAT
═══════════════════════════════════════════════════════════

When asked for schedule, format as:

"Here's your daily schedule, ${firstName}:

MORNING (with/before breakfast):
• [Medicine] - [dose]

AFTERNOON (after lunch):
• [Medicine] - [dose]

NIGHT (after dinner/bedtime):
• [Medicine] - [dose]

Remember: [any special timing notes]"

═══════════════════════════════════════════════════════════
VOICE CALL GUIDELINES
═══════════════════════════════════════════════════════════

1. Keep responses SHORT (2-3 sentences for voice)
2. Be warm and caring - this is a patient who needs help
3. Use simple language - no medical jargon
4. Reference SPECIFIC information from their records
5. When explaining medicines, include: what it's for, how to take, key precautions
6. If something isn't in records, say: "I don't see that in your records, ${firstName}. Would you like me to note this for your doctor?"

═══════════════════════════════════════════════════════════
PATIENT'S COMPLETE MEDICAL RECORDS
═══════════════════════════════════════════════════════════
${patientContext}

═══════════════════════════════════════════════════════════
CLINIC INFORMATION
═══════════════════════════════════════════════════════════
Clinic: ${org?.name || 'MediBridge Partner Clinic'}
Phone: ${org?.phone || 'Contact through app'}
Address: ${org?.address || 'Available in app'}

═══════════════════════════════════════════════════════════
REMEMBER
═══════════════════════════════════════════════════════════
You are Dr. Bridge - the BEST health assistant. You KNOW ${firstName}. 
You can explain ANY medicine - allopathic, ayurvedic, or homeopathic.
You speak Hindi, English, Hinglish - whatever the patient prefers.
You support patients across India in their preferred language.
Use the records above to help them. Be warm, knowledgeable, and helpful.
Make ${org?.name || 'the clinic'} and the doctor look like heroes!`;

    console.log('✅ System instructions built with FULL context + Multilingual Hinglish Greeting');
    console.log(`   📋 Prescriptions: ${prescriptions?.length || 0}`);
    console.log(`   💊 Medicines: ${allMedicines.length}`);
    console.log(`   💬 Chat sessions: ${chatSessions?.length || 0}`);
    console.log(`   📨 Messages: ${recentMessages.length}`);
    console.log(`   ⚠️ Escalations: ${escalations.length}`);
    console.log(`   🌐 Multilingual: Hindi, English, Hinglish supported`);

    // ============================================
    // STEP 9: Create Voice Call Record
    // ============================================
    
    const { data: voiceCall, error: callError } = await supabase
      .from('voice_calls')
      .insert({
        organization_id,
        patient_id,
        call_status: 'initiated',
        call_start_time: new Date().toISOString(),
        detected_language: 'en',
        patient_preferred_language: 'en',
        context_loaded: {
          prescriptions_count: prescriptions?.length || 0,
          medicines_count: allMedicines.length,
          chat_sessions_count: chatSessions?.length || 0,
          messages_count: recentMessages.length,
          escalations_count: escalations.length
        }
      })
      .select('id')
      .single();

    if (callError) {
      console.error('Voice call creation error:', callError);
      return NextResponse.json(
        { error: 'Failed to create voice call record' },
        { status: 500 }
      );
    }

    console.log('✅ Voice call record created:', voiceCall.id);

    // ============================================
    // STEP 10: Create OpenAI Realtime Session
    // ============================================
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔑 Creating OpenAI Realtime session...');

    const openaiResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        modalities: ['text', 'audio'],
        voice: 'alloy',
        instructions: systemInstructions,
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
          create_response: true
        }
      })
    });

    console.log('📥 OpenAI Response Status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      
      await supabase
        .from('voice_calls')
        .update({ call_status: 'failed' })
        .eq('id', voiceCall.id);

      return NextResponse.json(
        { error: `OpenAI error: ${errorText}` },
        { status: 500 }
      );
    }

    const sessionData = await openaiResponse.json();
    console.log('✅ OpenAI session created:', sessionData.id);

    const token = sessionData.client_secret?.value || sessionData.client_secret;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to get token from OpenAI' },
        { status: 500 }
      );
    }

    // ============================================
    // STEP 11: Return Success Response
    // ============================================
    
    return NextResponse.json({
      success: true,
      voice_call_id: voiceCall.id,
      token: token,
      session_id: sessionData.id,
      expires_at: sessionData.expires_at,
      context_loaded: {
        patient_name: patient.full_name,
        prescriptions: prescriptions?.length || 0,
        medicines: allMedicines.length,
        chat_sessions: chatSessions?.length || 0,
        messages: recentMessages.length,
        escalations: escalations.length
      },
      patient: {
        name: patient.full_name,
        age: patient.age,
        gender: patient.gender
      },
      organization: {
        name: org?.name
      }
    });

  } catch (error: any) {
    console.error('❌ Token generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'available',
    version: 'v6.1-multilingual-drbridge',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    description: 'v5-final-fix base + Enhanced with Hinglish greeting, multilingual support, Ayurvedic/Homeopathic knowledge, abbreviation decoder, call duration management - Dec 28, 2025',
    verified_columns: {
      prescriptions: 60,
      prescription_items: 17
    },
    enhancements: [
      'Hinglish initial greeting with multilingual hint',
      'Language adaptation (Hindi/English/Hinglish)',
      'Prescription abbreviation decoder (BD, TDS, OD, PC, AC)',
      'Ayurvedic medicine knowledge base',
      'Homeopathic medicine knowledge base', 
      'Medication schedule generation',
      'Call duration management (2:30 wrap, 4:30 conclude, 5:00 max)',
      'Clinic and doctor attribution'
    ]
  });
}