import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import {
  Users,
  FileText,
  FlaskConical,
  Pill,
  Calendar,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Stethoscope,
  ShoppingCart,
  CalendarCheck,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface DashboardMetrics {
  patients_registered: number;
  new_patients_today: number;
  prescriptions_analyzed: number;
  prescriptions_today: number;
  diagnostics_identified: number;
  medicines_prescribed: number;
  tests_booked: number;
  tests_booked_today: number;
  medicines_ordered: number;
  total_consultations: number;
  new_consultations: number;
  followup_consultations: number;
  today_consultations: number;
  pending_consultations: number;
  total_chats: number;
  today_chats: number;
  active_chats: number;
  clinic_in_loop_count: number;
  active_escalations: number;
  high_priority_escalations: number;
  today_medicines: number;
  generated_at: string;
}

interface WeeklyTrend {
  date: string;
  day_name: string;
  consultations: number;
  prescriptions: number;
  chats: number;
  lab_orders: number;
  escalations: number;
}

interface TodaySchedule {
  date: string;
  consultations: any[];
  lab_orders: any[];
  active_escalations: any[];
}

// ============================================
// METRIC CARD COMPONENT
// ============================================

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color: 'teal' | 'blue' | 'purple' | 'orange' | 'green' | 'red' | 'yellow' | 'pink';
  onClick?: () => void;
}

const colorConfig = {
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: 'bg-teal-500', text: 'text-teal-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'bg-blue-500', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'bg-purple-500', text: 'text-purple-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'bg-orange-500', text: 'text-orange-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'bg-green-500', text: 'text-green-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'bg-red-500', text: 'text-red-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: 'bg-yellow-500', text: 'text-yellow-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: 'bg-pink-500', text: 'text-pink-400' },
};

function MetricCard({ title, value, subtitle, icon: Icon, trend, color, onClick }: MetricCardProps) {
  const colors = colorConfig[color];
  
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border p-5
        ${colors.bg} ${colors.border}
        ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend !== undefined && trend !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(trend)} today</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUICK STAT COMPONENT
// ============================================

function QuickStat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <Icon className="w-5 h-5 text-slate-400" />
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ============================================
// TREND CHART COMPONENT
// ============================================

function TrendChart({ data, title }: { data: WeeklyTrend[]; title: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        <div className="h-48 flex items-center justify-center text-slate-500">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.prescriptions, d.chats, d.consultations, d.lab_orders))
  );
  
  return (
    <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-slate-400">Prescriptions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-400">Chats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-400">Consultations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-400">Lab Orders</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-end justify-between gap-3 h-48">
        {data.map((day, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center gap-1 h-40">
              <div 
                className="w-3 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t transition-all duration-500"
                style={{ height: `${maxValue > 0 ? (day.prescriptions / maxValue) * 100 : 0}%`, minHeight: day.prescriptions > 0 ? '4px' : '0' }}
                title={`Prescriptions: ${day.prescriptions}`}
              />
              <div 
                className="w-3 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-500"
                style={{ height: `${maxValue > 0 ? (day.chats / maxValue) * 100 : 0}%`, minHeight: day.chats > 0 ? '4px' : '0' }}
                title={`Chats: ${day.chats}`}
              />
              <div 
                className="w-3 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-500"
                style={{ height: `${maxValue > 0 ? (day.consultations / maxValue) * 100 : 0}%`, minHeight: day.consultations > 0 ? '4px' : '0' }}
                title={`Consultations: ${day.consultations}`}
              />
              <div 
                className="w-3 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t transition-all duration-500"
                style={{ height: `${maxValue > 0 ? (day.lab_orders / maxValue) * 100 : 0}%`, minHeight: day.lab_orders > 0 ? '4px' : '0' }}
                title={`Lab Orders: ${day.lab_orders}`}
              />
            </div>
            <span className="text-xs text-slate-500">{day.day_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// TODAY'S SCHEDULE COMPONENT
// ============================================

function TodaySchedule({ schedule }: { schedule: TodaySchedule | null }) {
  const navigate = useNavigate();
  
  if (!schedule) {
    return (
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
        <h3 className="text-white font-semibold mb-4">Today's Schedule</h3>
        <div className="h-48 flex items-center justify-center text-slate-500">
          Loading...
        </div>
      </div>
    );
  }

  const { consultations = [], lab_orders = [], active_escalations = [] } = schedule;

  return (
    <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Today's Schedule</h3>
        <span className="text-xs text-slate-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>
      
      <div className="space-y-4 max-h-[280px] overflow-y-auto">
        {/* Consultations */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-slate-400">Consultations ({consultations.length})</span>
          </div>
          {consultations.length === 0 ? (
            <p className="text-xs text-slate-600 pl-6">No consultations scheduled</p>
          ) : (
            <div className="space-y-2 pl-6">
              {consultations.slice(0, 4).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => navigate('/portal/consultations')}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-400">{c.time_slot || 'TBD'}</span>
                    <span className="text-xs text-white">{c.patient?.name || 'Patient'}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.consultation_status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    c.consultation_status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {c.consultation_status || 'pending'}
                  </span>
                </div>
              ))}
              {consultations.length > 4 && (
                <p className="text-xs text-teal-400 cursor-pointer hover:underline" onClick={() => navigate('/portal/consultations')}>
                  +{consultations.length - 4} more...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lab Orders */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-slate-400">Lab Orders ({lab_orders.length})</span>
          </div>
          {lab_orders.length === 0 ? (
            <p className="text-xs text-slate-600 pl-6">No lab orders scheduled</p>
          ) : (
            <div className="space-y-2 pl-6">
              {lab_orders.slice(0, 3).map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => navigate('/portal/lab-orders')}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-400">{l.time_slot || 'TBD'}</span>
                    <span className="text-xs text-white">{l.patient?.name || 'Patient'}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    l.booking_type === 'home_collection' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-teal-500/20 text-teal-400'
                  }`}>
                    {l.booking_type === 'home_collection' ? 'Home' : 'Clinic'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Escalations */}
        {active_escalations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-slate-400">Active Escalations ({active_escalations.length})</span>
            </div>
            <div className="space-y-2 pl-6">
              {active_escalations.slice(0, 2).map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors"
                  onClick={() => navigate('/portal/escalations')}>
                  <span className="text-xs text-white truncate max-w-[180px]">{e.reason || 'Needs attention'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    e.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    e.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {e.severity || 'medium'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// RECENT ACTIVITY COMPONENT
// ============================================

function RecentActivity() {
  const navigate = useNavigate();
  
  return (
    <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
      <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/portal/patients')}
          className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-colors text-left"
        >
          <Users className="w-5 h-5 text-teal-400 mb-2" />
          <p className="text-sm text-white font-medium">View Patients</p>
          <p className="text-xs text-slate-500">Browse all patients</p>
        </button>
        <button
          onClick={() => navigate('/portal/consultations')}
          className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors text-left"
        >
          <Calendar className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-sm text-white font-medium">Consultations</p>
          <p className="text-xs text-slate-500">Manage bookings</p>
        </button>
        <button
          onClick={() => navigate('/portal/lab-orders')}
          className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-left"
        >
          <FlaskConical className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-sm text-white font-medium">Lab Orders</p>
          <p className="text-xs text-slate-500">Track orders</p>
        </button>
        <button
          onClick={() => navigate('/portal/escalations')}
          className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors text-left"
        >
          <AlertTriangle className="w-5 h-5 text-orange-400 mb-2" />
          <p className="text-sm text-white font-medium">Escalations</p>
          <p className="text-xs text-slate-500">Review alerts</p>
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export function Dashboard() {
  const navigate = useNavigate();
  const { user, organization } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!organization?.id) return;

    try {
      // Fetch dashboard metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_dashboard_metrics', { org_id: organization.id });
      
      if (!metricsError && metricsData) {
        setMetrics(metricsData);
      }

      // Fetch weekly trends
      const { data: trendsData, error: trendsError } = await supabase
        .rpc('get_weekly_trends', { org_id: organization.id, days: 7 });
      
      if (!trendsError && trendsData) {
        setWeeklyTrends(Array.isArray(trendsData) ? trendsData : []);
      }

      // Fetch today's schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .rpc('get_todays_schedule', { org_id: organization.id });
      
      if (!scheduleError && scheduleData) {
        setTodaySchedule(scheduleData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [organization?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-slate-400">
            {organization?.name || 'Organization'} • Here's what's happening today in your clinic
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity className="w-4 h-4" />
            <span>Last updated: {metrics?.generated_at ? new Date(metrics.generated_at).toLocaleTimeString() : 'Now'}</span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Patients Registered"
          value={metrics?.patients_registered || 0}
          subtitle={`+${metrics?.new_patients_today || 0} today`}
          icon={Users}
          trend={metrics?.new_patients_today}
          color="teal"
          onClick={() => navigate('/portal/patients')}
        />
        <MetricCard
          title="Prescriptions Analyzed"
          value={metrics?.prescriptions_analyzed || 0}
          subtitle={`${metrics?.prescriptions_today || 0} today`}
          icon={FileText}
          trend={metrics?.prescriptions_today}
          color="blue"
        />
        <MetricCard
          title="Diagnostics Identified"
          value={metrics?.diagnostics_identified || 0}
          subtitle="Total tests found"
          icon={FlaskConical}
          color="purple"
          onClick={() => navigate('/portal/lab-orders')}
        />
        <MetricCard
          title="Medicines Prescribed"
          value={metrics?.medicines_prescribed || 0}
          subtitle={`${metrics?.today_medicines || 0} today`}
          icon={Pill}
          color="green"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tests Booked"
          value={metrics?.tests_booked || 0}
          subtitle={`${metrics?.tests_booked_today || 0} today`}
          icon={CalendarCheck}
          color="orange"
          onClick={() => navigate('/portal/lab-orders')}
        />
        <MetricCard
          title="Medicines Ordered"
          value={metrics?.medicines_ordered || 0}
          icon={ShoppingCart}
          color="yellow"
        />
        <MetricCard
          title="Total Chats"
          value={metrics?.total_chats || 0}
          subtitle={`${metrics?.today_chats || 0} today • ${metrics?.active_chats || 0} active`}
          icon={MessageSquare}
          color="blue"
          onClick={() => navigate('/portal/chat')}
        />
        <MetricCard
          title="Escalations"
          value={metrics?.active_escalations || 0}
          subtitle={`${metrics?.high_priority_escalations || 0} high priority`}
          icon={AlertTriangle}
          color={metrics?.high_priority_escalations ? 'red' : 'orange'}
          onClick={() => navigate('/portal/escalations')}
        />
      </div>

      {/* Consultations Overview */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Consultations Overview</h3>
          <button
            onClick={() => navigate('/portal/consultations')}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            View All →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <QuickStat label="Total" value={metrics?.total_consultations || 0} icon={Calendar} />
          <QuickStat label="New" value={metrics?.new_consultations || 0} icon={Users} />
          <QuickStat label="Follow-ups" value={metrics?.followup_consultations || 0} icon={TrendingUp} />
          <QuickStat label="Today" value={metrics?.today_consultations || 0} icon={Clock} />
          <QuickStat label="Pending" value={metrics?.pending_consultations || 0} icon={Clock} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={weeklyTrends} title="7-Day Activity Trends" />
        <TodaySchedule schedule={todaySchedule} />
      </div>

      {/* Quick Actions */}
      <RecentActivity />
    </div>
  );
}
