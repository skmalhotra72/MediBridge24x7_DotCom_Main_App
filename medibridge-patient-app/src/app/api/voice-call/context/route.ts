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
    const { patient_id, voice_call_id } = body;

    if (!patient_id) {
      return NextResponse.json(
        { error: 'Missing patient_id' },
        { status: 400 }
      );
    }

    // Get patient basic info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        id, full_name, age, age_unit, gender, phone,
        blood_group, known_allergies, chronic_conditions,
        current_medications, preferred_language, health_summary,
        organization_id
      `)
      .eq('id', patient_id)
      .single();

    if (patientError) {
      console.error('Patient fetch error:', patientError);
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get recent prescriptions (last 5)
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select(`
        id, prescription_date, doctor_name, clinic_name,
        diagnosis, chief_complaint, ai_summary,
        total_medicines, total_tests, follow_up_instructions, precautions
      `)
      .eq('patient_id', patient_id)
      .order('prescription_date', { ascending: false })
      .limit(5);

    // Get prescription items for recent prescriptions
    let prescriptionItems: any[] = [];
    if (prescriptions && prescriptions.length > 0) {
      const prescriptionIds = prescriptions.map(p => p.id);
      const { data: items } = await supabase
        .from('prescription_items')
        .select(`
          prescription_id, medicine_name, dosage, frequency,
          timing, duration, instructions, purpose
        `)
        .in('prescription_id', prescriptionIds);
      
      prescriptionItems = items || [];
    }

    // Get recent lab reports (last 3)
    const { data: labReports } = await supabase
      .from('lab_reports')
      .select(`
        id, lab_name, report_date, ai_summary,
        total_tests, abnormal_tests, critical_tests
      `)
      .eq('patient_id', patient_id)
      .order('report_date', { ascending: false })
      .limit(3);

    // Get lab test results
    let labResults: any[] = [];
    if (labReports && labReports.length > 0) {
      const reportIds = labReports.map(r => r.id);
      const { data: results } = await supabase
        .from('lab_test_results')
        .select(`
          lab_report_id, test_name, test_category,
          result_value, result_unit, reference_range_text,
          status, severity, interpretation
        `)
        .in('lab_report_id', reportIds);
      
      labResults = results || [];
    }

    // Get recent chat summary (last 1)
    const { data: recentChat } = await supabase
      .from('chat_sessions')
      .select('chat_summary, topics_discussed, patient_sentiment, requires_followup')
      .eq('patient_id', patient_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get pending escalations
    const { data: escalations } = await supabase
      .from('escalations')
      .select('escalation_type, severity, status, ai_recommendation')
      .eq('patient_id', patient_id)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(3);

    // Build comprehensive context object
    const patientContext = {
      patient: {
        id: patient.id,
        name: patient.full_name,
        age: patient.age,
        age_unit: patient.age_unit,
        gender: patient.gender,
        phone: patient.phone,
        blood_group: patient.blood_group,
        allergies: patient.known_allergies || [],
        chronic_conditions: patient.chronic_conditions || [],
        current_medications: patient.current_medications || [],
        preferred_language: patient.preferred_language,
        health_summary: patient.health_summary
      },
      prescriptions: prescriptions?.map(p => ({
        ...p,
        items: prescriptionItems.filter(i => i.prescription_id === p.id)
      })) || [],
      lab_reports: labReports?.map(r => ({
        ...r,
        results: labResults.filter(res => res.lab_report_id === r.id)
      })) || [],
      recent_chat: recentChat || null,
      pending_escalations: escalations || []
    };

    // Generate AI-friendly context summary
    const contextSummary = generateContextSummary(patientContext);

    // If voice_call_id provided, save context to voice_call_context table
    if (voice_call_id) {
      const { error: contextError } = await supabase
        .from('voice_call_context')
        .upsert({
          voice_call_id,
          patient_name: patient.full_name,
          patient_age: patient.age,
          patient_gender: patient.gender,
          recent_prescriptions: patientContext.prescriptions,
          recent_lab_reports: patientContext.lab_reports,
          active_medications: patient.current_medications || [],
          known_allergies: patient.known_allergies || [],
          chronic_conditions: patient.chronic_conditions || [],
          recent_chat_summary: recentChat?.chat_summary || null,
          pending_follow_ups: escalations || [],
          custom_instructions: null,
          escalation_threshold: 'medium'
        }, {
          onConflict: 'voice_call_id'
        });

      if (contextError) {
        console.error('Context save error:', contextError);
      }
    }

    return NextResponse.json({
      success: true,
      patient_id,
      context: patientContext,
      ai_context_summary: contextSummary,
      stats: {
        prescriptions_loaded: prescriptions?.length || 0,
        medications_loaded: prescriptionItems.length,
        lab_reports_loaded: labReports?.length || 0,
        lab_results_loaded: labResults.length,
        has_recent_chat: !!recentChat,
        pending_escalations: escalations?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Context fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateContextSummary(context: any): string {
  const { patient, prescriptions, lab_reports, recent_chat, pending_escalations } = context;
  
  let summary = `PATIENT CONTEXT FOR DR. BRIDGE:\n\n`;
  
  // Patient basics
  summary += `PATIENT: ${patient.name}`;
  if (patient.age) summary += `, ${patient.age} ${patient.age_unit || 'years'} old`;
  if (patient.gender) summary += `, ${patient.gender}`;
  summary += `\n`;
  
  // Allergies (important!)
  if (patient.allergies && patient.allergies.length > 0) {
    summary += `⚠️ ALLERGIES: ${patient.allergies.join(', ')}\n`;
  }
  
  // Chronic conditions
  if (patient.chronic_conditions && patient.chronic_conditions.length > 0) {
    summary += `CHRONIC CONDITIONS: ${patient.chronic_conditions.join(', ')}\n`;
  }
  
  // Current medications
  if (patient.current_medications && patient.current_medications.length > 0) {
    summary += `CURRENT MEDICATIONS: ${patient.current_medications.join(', ')}\n`;
  }
  
  summary += `\n`;
  
  // Latest prescription
  if (prescriptions && prescriptions.length > 0) {
    const latest = prescriptions[0];
    summary += `LATEST PRESCRIPTION (${latest.prescription_date || 'Recent'}):\n`;
    if (latest.doctor_name) summary += `- Doctor: ${latest.doctor_name}\n`;
    if (latest.diagnosis) summary += `- Diagnosis: ${latest.diagnosis}\n`;
    if (latest.chief_complaint) summary += `- Chief Complaint: ${latest.chief_complaint}\n`;
    
    if (latest.items && latest.items.length > 0) {
      summary += `- Medicines:\n`;
      latest.items.forEach((item: any) => {
        summary += `  • ${item.medicine_name}`;
        if (item.dosage) summary += ` - ${item.dosage}`;
        if (item.frequency) summary += `, ${item.frequency}`;
        if (item.duration) summary += ` for ${item.duration}`;
        summary += `\n`;
      });
    }
    
    if (latest.precautions) summary += `- Precautions: ${latest.precautions}\n`;
    if (latest.follow_up_instructions) summary += `- Follow-up: ${latest.follow_up_instructions}\n`;
  }
  
  summary += `\n`;
  
  // Latest lab report
  if (lab_reports && lab_reports.length > 0) {
    const latest = lab_reports[0];
    summary += `LATEST LAB REPORT (${latest.report_date || 'Recent'}):\n`;
    if (latest.lab_name) summary += `- Lab: ${latest.lab_name}\n`;
    if (latest.abnormal_tests > 0) {
      summary += `- ⚠️ ${latest.abnormal_tests} abnormal results found\n`;
    }
    if (latest.results && latest.results.length > 0) {
      const abnormal = latest.results.filter((r: any) => r.status === 'abnormal' || r.status === 'critical');
      if (abnormal.length > 0) {
        summary += `- Abnormal values:\n`;
        abnormal.forEach((r: any) => {
          summary += `  • ${r.test_name}: ${r.result_value} ${r.result_unit || ''} (Ref: ${r.reference_range_text || 'N/A'})\n`;
        });
      }
    }
    if (latest.ai_summary) summary += `- Summary: ${latest.ai_summary}\n`;
  }
  
  // Recent conversation
  if (recent_chat && recent_chat.chat_summary) {
    summary += `\nRECENT CONVERSATION:\n${recent_chat.chat_summary}\n`;
    if (recent_chat.requires_followup) {
      summary += `⚠️ Patient requested follow-up\n`;
    }
  }
  
  // Pending escalations
  if (pending_escalations && pending_escalations.length > 0) {
    summary += `\n⚠️ PENDING ESCALATIONS:\n`;
    pending_escalations.forEach((e: any) => {
      summary += `- ${e.escalation_type} (${e.severity}): ${e.ai_recommendation || 'Review needed'}\n`;
    });
  }
  
  return summary;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patient_id = searchParams.get('patient_id');

  if (!patient_id) {
    return NextResponse.json(
      { error: 'Missing patient_id parameter' },
      { status: 400 }
    );
  }

  // Quick check for patient data availability
  const { data: patient } = await supabase
    .from('patients')
    .select('id, full_name')
    .eq('id', patient_id)
    .single();

  if (!patient) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 }
    );
  }

  // Count available data
  const { count: prescriptionCount } = await supabase
    .from('prescriptions')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patient_id);

  const { count: labCount } = await supabase
    .from('lab_reports')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patient_id);

  const { count: chatCount } = await supabase
    .from('chat_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patient_id);

  return NextResponse.json({
    patient_id,
    patient_name: patient.full_name,
    data_available: true,
    data_counts: {
      prescriptions: prescriptionCount || 0,
      lab_reports: labCount || 0,
      chat_sessions: chatCount || 0
    }
  });
}