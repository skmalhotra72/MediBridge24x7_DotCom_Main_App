import { createClient } from '@/lib/supabase/client';

export interface DailyAnalytics {
  id: string;
  organization_id: string;
  date: string;
  total_prescriptions: number;
  total_chats: number;
  total_messages: number;
  total_lab_bookings: number;
  escalation_count: number;
  unique_patients: number;
}

export interface AnalyticsSummary {
  today: DailyAnalytics | null;
  thisWeek: DailyAnalytics[];
  totals: {
    prescriptions: number;
    messages: number;
    labBookings: number;
    escalations: number;
  };
}

export async function getAnalyticsSummary(organizationId: string): Promise<AnalyticsSummary> {
  const supabase = createClient();
  
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get daily analytics for the past week
  const { data: dailyData } = await supabase
    .from('analytics_daily')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('date', weekAgo)
    .order('date', { ascending: false });

  const analytics = dailyData || [];
  
  // Calculate totals
  const totals = analytics.reduce((acc, day) => ({
    prescriptions: acc.prescriptions + (day.total_prescriptions || 0),
    messages: acc.messages + (day.total_messages || 0),
    labBookings: acc.labBookings + (day.total_lab_bookings || 0),
    escalations: acc.escalations + (day.escalation_count || 0),
  }), { prescriptions: 0, messages: 0, labBookings: 0, escalations: 0 });

  return {
    today: analytics.find(d => d.date === today) || null,
    thisWeek: analytics,
    totals
  };
}

export async function getRecentMessages(organizationId: string, limit = 10) {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('messages')
    .select(`
      id,
      sender_type,
      message,
      created_at,
      chat_session_id
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}