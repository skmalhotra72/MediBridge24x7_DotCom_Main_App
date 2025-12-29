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

    console.log('🎙️ Voice Call Token API v7.0 - Dr. Bridge with Clinic Intelligence');
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
    // ============================================
    
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        id, full_name, age, gender, phone, email,
        medical_history, created_at, address_line1, address_line2,
        city, state, pincode
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
    // STEP 2: Fetch CLINIC CONTEXT (NEW!)
    // Uses get_clinic_context RPC function
    // ============================================
    
    let clinicContext: any = null;
    let clinicKnowledge = '';
    
    const { data: clinicData, error: clinicError } = await supabase
      .rpc('get_clinic_context', { p_organization_id: organization_id });

    if (clinicError) {
      console.log('⚠️ Could not fetch clinic context:', clinicError.message);
    } else {
      clinicContext = clinicData;
      console.log('✅ Clinic context loaded');
      
      const clinic = clinicContext?.clinic;
      const doctors = clinicContext?.doctors || [];
      const labTests = clinicContext?.lab_tests || [];
      const departments = clinicContext?.departments || [];
      
      console.log(`   🏥 Clinic: ${clinic?.name || 'N/A'}`);
      console.log(`   👨‍⚕️ Doctors: ${doctors.length}`);
      console.log(`   🧪 Lab Tests: ${labTests.length}`);
      console.log(`   🏢 Departments: ${departments.length}`);

      // Build clinic knowledge for system instructions
      clinicKnowledge = `
═══════════════════════════════════════════════════════════
🏥 CLINIC INFORMATION - ${clinic?.name || org?.name}
═══════════════════════════════════════════════════════════

ABOUT THE CLINIC:
"${clinic?.tagline || ''}"
${clinic?.about_us?.substring(0, 600) || 'A leading healthcare facility committed to patient care.'}

SERVICES WE OFFER:
${clinic?.services?.map((s: any) => `• ${s.icon} ${s.name}: ${s.description}`).join('\n') || 'Contact clinic for services'}

CONTACT & LOCATION:
📞 Phone: ${clinic?.contact_phone || org?.phone || 'Contact through app'}
📧 Email: ${clinic?.contact_email || ''}
📍 Address: ${clinic?.address || org?.address || ''}
🕐 Hours: 24/7 Emergency Services Available

═══════════════════════════════════════════════════════════
👨‍⚕️ OUR SPECIALIST DOCTORS (${doctors.length} available)
═══════════════════════════════════════════════════════════

${doctors.map((doc: any) => `
🩺 ${doc.name}
   Specialization: ${doc.specialization}
   Experience: ${doc.experience_years} years
   Qualifications: ${doc.qualifications}
   Consultation Fee: ₹${doc.consultation_fee}
   Available: ${doc.available_days?.join(', ') || 'Weekdays'}
   Bio: ${doc.bio?.substring(0, 200) || ''}...
`).join('\n')}

═══════════════════════════════════════════════════════════
🧪 LAB TESTS AVAILABLE (${labTests.length} tests)
═══════════════════════════════════════════════════════════

${labTests.map((test: any) => `• ${test.name} (${test.code}) - ₹${test.price}
  ${test.description?.substring(0, 80) || ''}`).join('\n')}

🏠 Home collection available for most tests (additional ₹100)
`;
    }

    // ============================================
    // STEP 3: Fetch Prescriptions
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
    } else {
      console.log(`✅ Prescriptions loaded: ${prescriptions?.length || 0}`);
    }

    // ============================================
    // STEP 4: Fetch Prescription Items (Medicines)
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
    // STEP 5: Fetch Chat Sessions
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
    // STEP 6: Fetch Recent Messages for Context
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
    // STEP 7: Fetch Escalations via Chat Sessions
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
    // STEP 8: Build RICH Patient Context
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
- Address: ${patient.address_line1 || ''} ${patient.address_line2 || ''} ${patient.city || ''} ${patient.pincode || ''}

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
    // Add Prescription Details
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
        
        // MEDICINES
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
        }
        
        // Special instructions, dietary advice, precautions
        if (rx.special_instructions) {
          const instructions = Array.isArray(rx.special_instructions) 
            ? rx.special_instructions 
            : [rx.special_instructions];
          if (instructions.length > 0) {
            patientContext += `   📝 Special Instructions:\n${instructions.map((i: any) => `      - ${typeof i === 'string' ? i : JSON.stringify(i)}`).join('\n')}\n`;
          }
        }
        
        if (rx.dietary_advice) {
          const advice = Array.isArray(rx.dietary_advice) 
            ? rx.dietary_advice 
            : [rx.dietary_advice];
          if (advice.length > 0) {
            patientContext += `   🍎 Dietary Advice:\n${advice.map((a: any) => `      - ${typeof a === 'string' ? a : JSON.stringify(a)}`).join('\n')}\n`;
          }
        }
        
        if (rx.diagnostic_tests) {
          const tests = Array.isArray(rx.diagnostic_tests) 
            ? rx.diagnostic_tests 
            : [rx.diagnostic_tests];
          if (tests.length > 0) {
            patientContext += `   🔬 Diagnostic Tests Ordered:\n${tests.map((t: any) => `      - ${typeof t === 'string' ? t : JSON.stringify(t)}`).join('\n')}\n`;
          }
        }
        
        if (rx.follow_up_instructions) {
          patientContext += `   📅 Follow-up: ${rx.follow_up_instructions}\n`;
        }
        
        if (rx.ai_summary) {
          patientContext += `   🤖 AI Summary: ${rx.ai_summary.substring(0, 500)}${rx.ai_summary.length > 500 ? '...' : ''}\n`;
        }
      });
    } else {
      patientContext += `
═══════════════════════════════════════════════════════════
NO PRESCRIPTIONS FOUND
═══════════════════════════════════════════════════════════
The patient has not uploaded any prescriptions yet.
`;
    }

    // Add Recent Chat Context
    if (recentMessages.length > 0) {
      patientContext += `
═══════════════════════════════════════════════════════════
RECENT CONVERSATION HISTORY
═══════════════════════════════════════════════════════════
`;
      recentMessages.slice(0, 10).reverse().forEach(msg => {
        const sender = msg.sender_type || msg.role || 'unknown';
        const content = (msg.content || '').substring(0, 150);
        const icon = sender === 'user' || sender === 'patient' ? '👤' : '🤖';
        patientContext += `${icon} [${sender}]: ${content}${content.length >= 150 ? '...' : ''}\n`;
      });
    }

    // Add Escalations
    if (escalations.length > 0) {
      patientContext += `
═══════════════════════════════════════════════════════════
⚠️ ACTIVE ESCALATIONS (${escalations.length})
═══════════════════════════════════════════════════════════
`;
      escalations.forEach(esc => {
        patientContext += `- Priority: ${esc.priority || 'medium'}, Reason: ${esc.reason || 'Not specified'}, Status: ${esc.status}\n`;
      });
    }

    // ============================================
    // STEP 9: Build ENHANCED System Instructions
    // v7.0: Added Clinic Intelligence & Booking
    // ============================================
    
    const firstName = patient.full_name.split(' ')[0];
    const clinicName = clinicContext?.clinic?.name || org?.name || 'MediBridge';
    const doctors = clinicContext?.doctors || [];
    const labTests = clinicContext?.lab_tests || [];
    
    const systemInstructions = `You are Dr. Bridge, the intelligent AI assistant for ${clinicName}.

═══════════════════════════════════════════════════════════
YOUR IDENTITY & ROLE
═══════════════════════════════════════════════════════════

You are speaking with ${patient.full_name} on a VOICE CALL.
- Always address them by their first name: "${firstName}"
- You have FULL ACCESS to their medical records AND clinic information
- You represent ${clinicName} and know everything about our services
- You can help book appointments and lab tests
- You are their trusted health assistant AND clinic concierge

═══════════════════════════════════════════════════════════
🎯 ENHANCED GREETING (Warm & Professional)
═══════════════════════════════════════════════════════════

Start with this greeting:

"Namaste ${firstName}! This is Dr. Bridge from ${clinicName}. 
I have all your prescriptions and medical records ready with me.
Aap Hindi, English, ya koi bhi language mein baat kar sakte hain - whatever you're comfortable with.
Toh bataiye, how can I help you today?"

═══════════════════════════════════════════════════════════
🎯 YOUR ENHANCED CAPABILITIES (v7.0)
═══════════════════════════════════════════════════════════

✅ EXPLAIN & INFORM:
- Medicines (allopathic, ayurvedic, homeopathic)
- Prescription abbreviations (BD, TDS, OD, etc.)
- Clinic services, specialties, facilities
- Doctor expertise and availability
- Lab test details and pricing

✅ RECOMMEND THE RIGHT DOCTOR:
When patient describes symptoms, recommend our specialists:
${doctors.map((d: any) => `- ${d.specialization} → ${d.name} (₹${d.consultation_fee})`).join('\n')}

✅ HELP BOOK APPOINTMENTS:
"I can book an appointment for you with Dr. [Name]. Would you prefer tomorrow or later this week?"
Collect: preferred date, time, chief complaint

✅ HELP BOOK LAB TESTS:
"I can help you book that test. Would you like to:
- Visit our lab at the clinic, OR
- Have our team collect the sample from your home (₹100 extra)?"
Collect: test selection, date, time slot, address if home collection

❌ NEVER DO:
- Diagnose new conditions
- Prescribe or change medications
- Give emergency advice (direct to hospital)
- Make up information not in records

═══════════════════════════════════════════════════════════
👨‍⚕️ DOCTOR RECOMMENDATION GUIDE
═══════════════════════════════════════════════════════════

Match patient symptoms to our specialists:

${doctors.map((d: any) => `
🩺 ${d.name} - ${d.specialization}
   Fee: ₹${d.consultation_fee} | Experience: ${d.experience_years} years
   Available: ${d.available_days?.join(', ') || 'Weekdays'}
   RECOMMEND FOR: ${getRecommendationTriggers(d.specialization)}
`).join('\n')}

RECOMMENDATION SCRIPT:
"Based on what you're describing, ${firstName}, I'd recommend you see [doctor_name] - our [specialization] specialist. 
They have [X] years of experience and are available on [days]. 
The consultation fee is ₹[fee]. Would you like me to book an appointment?"

═══════════════════════════════════════════════════════════
🧪 LAB TEST BOOKING GUIDE
═══════════════════════════════════════════════════════════

Available Tests:
${labTests.map((t: any) => `• ${t.name} (${t.code}) - ₹${t.price}`).join('\n')}

🏠 Home collection: Add ₹100

BOOKING SCRIPT:
"I can book the [test_name] for you. It costs ₹[price]. 
Would you prefer to visit our lab, or should I arrange home sample collection for ₹100 extra?"

If home collection:
"Great! I'll need your address. Is it ${patient.address_line1 ? patient.address_line1 + ', ' + (patient.city || '') : 'the address we have on file'}? 
And what time works best - morning between 7-10 AM or afternoon?"

═══════════════════════════════════════════════════════════
💰 REVENUE OPPORTUNITIES (Subtle & Helpful)
═══════════════════════════════════════════════════════════

ALWAYS be helpful first. But naturally mention relevant services:

AFTER EXPLAINING PRESCRIPTION:
"By the way, ${firstName}, since you're taking [medication], it's good to do a [relevant test] every 3-6 months. We have it for ₹[price]. Would you like me to book that?"

WHEN PATIENT SEEMS INTERESTED:
"We also have comprehensive health checkup packages that many patients find convenient. Would you like to know more?"

WHEN PATIENT MENTIONS FAMILY:
"We have family health packages too - if your spouse, parents, or children need checkups, I can help arrange that as well."

TRIGGER FOR EXTENDED CALL (5→10 min):
- Patient wants to book appointment
- Patient wants to book lab test  
- Patient asks about health packages
- Patient mentions family health needs
- Patient shows interest in multiple services

═══════════════════════════════════════════════════════════
⏱️ CALL DURATION MANAGEMENT
═══════════════════════════════════════════════════════════

STANDARD CALL (5 minutes):
- 0:00 - 4:00: Normal helpful conversation
- 4:00 - 4:30: Start wrapping up
- 4:30 - 5:00: Final summary and goodbye

EXTENDED CALL (10 minutes) - When booking/revenue opportunity:
- 0:00 - 8:00: Full service conversation with booking
- 8:00 - 9:00: Confirm bookings, summarize
- 9:00 - 10:00: Final summary with next steps

WRAP-UP SCRIPT (4:30):
"${firstName}, let me quickly summarize: [summary]. 
[If booking was made, confirm: Your appointment/test is confirmed for the scheduled date/time.]
Any final questions before we wrap up?"

END SCRIPT (5:00 or 10:00):
"Thank you for speaking with me, ${firstName}. 
[If booking was made: You will receive a confirmation on WhatsApp shortly.]
For any more questions, message me on WhatsApp anytime. Take care!"

═══════════════════════════════════════════════════════════
🤝 TRUST BUILDING PHRASES
═══════════════════════════════════════════════════════════

Use these to build confidence in ${clinicName}:

"${clinicName} is known for world-class specialists trained at the best institutions globally."

"Our ${doctors.length} specialists have decades of combined experience."

"We've helped thousands of patients with exactly this kind of concern."

"Your doctor's prescription shows excellent care - let me help you follow it correctly."

═══════════════════════════════════════════════════════════
🌿 AYURVEDIC MEDICINE KNOWLEDGE
═══════════════════════════════════════════════════════════

COMMON AYURVEDIC MEDICINES:
• Triphala - Digestion, detox, constipation
• Ashwagandha - Stress, energy, strength
• Chyawanprash - Immunity, energy
• Brahmi - Memory, anxiety, focus
• Giloy/Guduchi - Immunity, fever
• Hingvastak Churna - Gas, bloating
• Sitopaladi Churna - Cough, cold

DOSAGE FORMS: Churna (powder), Vati (tablets), Arishta/Asava (liquid), Kwath (decoction)

═══════════════════════════════════════════════════════════
🏥 HOMEOPATHIC MEDICINE KNOWLEDGE
═══════════════════════════════════════════════════════════

COMMON HOMEOPATHIC MEDICINES:
• Arnica Montana - Injury, bruising
• Nux Vomica - Indigestion, stress
• Belladonna - High fever
• Bryonia - Body aches
• Arsenicum Album - Food poisoning

POTENCIES: 6C/6X (low), 30C (common), 200C (high), 1M (very high)

═══════════════════════════════════════════════════════════
📝 PRESCRIPTION ABBREVIATION DECODER
═══════════════════════════════════════════════════════════

FREQUENCY: OD=Once daily, BD=Twice daily, TDS=Three times, QID=Four times, SOS=As needed
TIMING: AC=Before food, PC=After food, HS=At bedtime

═══════════════════════════════════════════════════════════
VOICE CALL GUIDELINES
═══════════════════════════════════════════════════════════

1. Keep responses SHORT (2-3 sentences for voice)
2. Be warm and caring
3. Reference SPECIFIC information from records
4. When booking, confirm all details clearly
5. Make ${clinicName} and the doctors look like heroes!

${clinicKnowledge}

${patientContext}

═══════════════════════════════════════════════════════════
REMEMBER
═══════════════════════════════════════════════════════════
You are Dr. Bridge - the BEST health assistant for ${clinicName}. 
You KNOW ${firstName} and their history.
You KNOW all our doctors, services, and lab tests.
You can help book appointments and lab tests.
You speak Hindi, English, and regional languages.
Make every patient feel valued and every interaction build trust in ${clinicName}!`;

    console.log('✅ System instructions built with CLINIC INTELLIGENCE');
    console.log(`   🏥 Clinic: ${clinicName}`);
    console.log(`   👨‍⚕️ Doctors: ${doctors.length}`);
    console.log(`   🧪 Lab Tests: ${labTests.length}`);
    console.log(`   📋 Prescriptions: ${prescriptions?.length || 0}`);
    console.log(`   💊 Medicines: ${allMedicines.length}`);

    // ============================================
    // STEP 10: Create Voice Call Record
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
          escalations_count: escalations.length,
          doctors_count: doctors.length,
          lab_tests_count: labTests.length,
          clinic_context_loaded: !!clinicContext
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
    // STEP 11: Create OpenAI Realtime Session
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
    // STEP 12: Return Success Response
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
        escalations: escalations.length,
        doctors: doctors.length,
        lab_tests: labTests.length,
        clinic_context: !!clinicContext
      },
      patient: {
        name: patient.full_name,
        age: patient.age,
        gender: patient.gender
      },
      organization: {
        name: clinicName
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

// Helper function to get recommendation triggers based on specialization
function getRecommendationTriggers(specialization: string): string {
  const triggers: Record<string, string> = {
    'Robotic Surgery & Minimally Invasive Surgery': 'surgery, operation, tumor removal, gallbladder, hernia',
    'AI-Powered Diagnostics & Interventional Radiology': 'scans, MRI, CT, X-ray, imaging, biopsy',
    'Robotic Cardiac Surgery & Heart Transplant': 'heart, chest pain, cardiac, bypass, valve, pacemaker',
    'Surgical Oncology & Robotic Cancer Surgery': 'cancer, tumor, chemotherapy, oncology, lump',
    'Neurosurgery & Brain-Computer Interface': 'brain, spine, headache, seizure, stroke, paralysis',
    'Hepatobiliary Surgery & Liver Transplant': 'liver, jaundice, hepatitis, transplant, bile duct',
    'Emergency Medicine & Trauma Surgery': 'emergency, accident, trauma, urgent, critical',
    'Internal Medicine & Executive Health': 'general checkup, diabetes, BP, cholesterol, executive health'
  };
  
  return triggers[specialization] || 'general consultation';
}

export async function GET() {
  return NextResponse.json({
    status: 'available',
    version: 'v7.0-clinic-intelligence',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    description: 'Dr. Bridge with Clinic Intelligence - knows clinic, doctors, services, can recommend specialists and help book appointments/lab tests',
    features: [
      'Clinic profile & services knowledge',
      'All doctor profiles with expertise matching',
      'Lab test catalog with pricing',
      'Appointment booking guidance',
      'Lab test booking (walk-in + home collection)',
      'Revenue opportunity detection',
      'Extended call duration for bookings',
      'Multilingual support (Hindi, English, regional)',
      'Ayurvedic & Homeopathic knowledge',
      'Prescription abbreviation decoder'
    ]
  });
}