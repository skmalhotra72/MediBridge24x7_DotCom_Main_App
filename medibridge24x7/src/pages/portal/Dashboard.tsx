import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabaseClient';
import { Card } from '../../components';
import {
  Calendar,
  Users,
  FlaskConical,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Metrics {
  todayConsultations: number;
  yesterdayConsultations: number;
  queueLength: number;
  pendingLabReports: number;
  activeChats: number;
}

interface ConsultationTrend {
  date: string;
  count: number;
}

interface LabStatusData {
  name: string;
  value: number;
  color: string;
}

interface RecentConsultation {
  id: string;
  patient_name: string;
  consultation_date: string;
  status: string;
}

interface RecentLabOrder {
  id: string;
  patient_name: string;
  test_names: string;
  status: string;
  created_at: string;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, organization } = useAuthStore();
  const [metrics, setMetrics] = useState<Metrics>({
    todayConsultations: 0,
    yesterdayConsultations: 0,
    queueLength: 0,
    pendingLabReports: 0,
    activeChats: 0,
  });
  const [consultationTrend, setConsultationTrend] = useState<ConsultationTrend[]>([]);
  const [labStatusData, setLabStatusData] = useState<LabStatusData[]>([]);
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);
  const [recentLabOrders, setRecentLabOrders] = useState<RecentLabOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      loadDashboardData();
    }
  }, [organization?.id]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadMetrics(),
        loadConsultationTrend(),
        loadLabStatusData(),
        loadRecentActivity(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [todayResult, yesterdayResult, queueResult, labResult, chatResult] = await Promise.all([
      supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization!.id)
        .gte('consultation_date', today)
        .lt('consultation_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])
        .neq('status', 'cancelled'),

      supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization!.id)
        .gte('consultation_date', yesterday)
        .lt('consultation_date', today)
        .neq('status', 'cancelled'),

      supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization!.id)
        .eq('status', 'scheduled')
        .gte('consultation_date', new Date().toISOString()),

      supabase
        .from('lab_orders')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization!.id)
        .in('status', ['pending', 'sample_collected', 'in_progress']),

      supabase
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization!.id)
        .eq('status', 'active'),
    ]);

    setMetrics({
      todayConsultations: todayResult.count || 0,
      yesterdayConsultations: yesterdayResult.count || 0,
      queueLength: queueResult.count || 0,
      pendingLabReports: labResult.count || 0,
      activeChats: chatResult.count || 0,
    });
  };

  const loadConsultationTrend = async () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - i * 86400000);
      return date.toISOString().split('T')[0];
    }).reverse();

    const trendData = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(new Date(date).getTime() + 86400000)
          .toISOString()
          .split('T')[0];

        const { count } = await supabase
          .from('consultations')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization!.id)
          .gte('consultation_date', date)
          .lt('consultation_date', nextDay)
          .neq('status', 'cancelled');

        return {
          date: new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          count: count || 0,
        };
      })
    );

    setConsultationTrend(trendData);
  };

  const loadLabStatusData = async () => {
    const statuses = ['pending', 'sample_collected', 'in_progress', 'completed'];
    const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

    const statusData = await Promise.all(
      statuses.map(async (status, index) => {
        const { count } = await supabase
          .from('lab_orders')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization!.id)
          .eq('status', status);

        return {
          name: status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          value: count || 0,
          color: colors[index],
        };
      })
    );

    setLabStatusData(statusData);
  };

  const loadRecentActivity = async () => {
    const { data: consultationsData } = await supabase
      .from('consultations')
      .select('id, patient_id, consultation_date, status')
      .eq('organization_id', organization!.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (consultationsData) {
      const consultationsWithPatients = await Promise.all(
        consultationsData.map(async (consultation) => {
          const { data: patientData } = await supabase
            .from('patients')
            .select('full_name')
            .eq('id', consultation.patient_id)
            .maybeSingle();

          return {
            id: consultation.id,
            patient_name: patientData?.full_name || 'Unknown Patient',
            consultation_date: consultation.consultation_date,
            status: consultation.status,
          };
        })
      );
      setRecentConsultations(consultationsWithPatients);
    }

    const { data: labOrdersData } = await supabase
      .from('lab_orders')
      .select('id, patient_id, status, created_at')
      .eq('organization_id', organization!.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (labOrdersData) {
      const labOrdersWithDetails = await Promise.all(
        labOrdersData.map(async (order) => {
          const [patientResult, testsResult] = await Promise.all([
            supabase.from('patients').select('full_name').eq('id', order.patient_id).maybeSingle(),
            supabase
              .from('lab_order_tests')
              .select('lab_tests(name)')
              .eq('lab_order_id', order.id),
          ]);

          const testNames =
            testsResult.data
              ?.map((t: any) => t.lab_tests?.name)
              .filter(Boolean)
              .join(', ') || 'No tests';

          return {
            id: order.id,
            patient_name: patientResult.data?.full_name || 'Unknown Patient',
            test_names: testNames,
            status: order.status,
            created_at: order.created_at,
          };
        })
      );
      setRecentLabOrders(labOrdersWithDetails);
    }
  };

  const getTrendIndicator = () => {
    const diff = metrics.todayConsultations - metrics.yesterdayConsultations;
    if (diff > 0) {
      return (
        <span className="inline-flex items-center text-green-400 text-sm">
          <TrendingUp className="w-4 h-4 mr-1" />+{diff} vs yesterday
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="inline-flex items-center text-red-400 text-sm">
          <TrendingDown className="w-4 h-4 mr-1" />
          {diff} vs yesterday
        </span>
      );
    }
    return <span className="text-slate-400 text-sm">Same as yesterday</span>;
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      scheduled: 'bg-blue-900 text-blue-300 border-blue-700',
      completed: 'bg-green-900 text-green-300 border-green-700',
      in_progress: 'bg-amber-900 text-amber-300 border-amber-700',
      pending: 'bg-slate-900 text-slate-300 border-slate-700',
      sample_collected: 'bg-purple-900 text-purple-300 border-purple-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status] || styles.pending
        }`}
      >
        {status
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
      </span>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-8 text-white shadow-xl">
          <div className="h-8 bg-white bg-opacity-20 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-6 bg-white bg-opacity-20 rounded w-48 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-32 mb-3"></div>
                <div className="h-8 bg-slate-700 rounded w-20"></div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <div className="animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-40 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-32 bg-slate-700 rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const widgets = [
    {
      title: "Today's Consultations",
      value: metrics.todayConsultations,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900 bg-opacity-20',
      trend: getTrendIndicator(),
    },
    {
      title: 'Queue Length',
      value: metrics.queueLength,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900 bg-opacity-20',
      subtitle: 'Scheduled appointments',
    },
    {
      title: 'Pending Lab Reports',
      value: metrics.pendingLabReports,
      icon: FlaskConical,
      color: 'text-amber-400',
      bgColor: 'bg-amber-900 bg-opacity-20',
      subtitle: 'Awaiting results',
    },
    {
      title: 'Active Chats',
      value: metrics.activeChats,
      icon: MessageSquare,
      color: 'text-green-400',
      bgColor: 'bg-green-900 bg-opacity-20',
      subtitle: 'Ongoing conversations',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.full_name || 'User'}!
        </h1>
        <p className="text-white text-opacity-90 text-lg">
          {organization?.name || 'Your Organization'}
        </p>
        <p className="text-white text-opacity-75 mt-2">
          Here's what's happening today in your clinic
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((widget) => (
          <Card key={widget.title} className="bg-slate-800 border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-400 mb-1">{widget.title}</p>
                <p className="text-3xl font-bold text-white mb-2">{widget.value}</p>
                {widget.trend && <div className="mt-2">{widget.trend}</div>}
                {widget.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{widget.subtitle}</p>
                )}
              </div>
              <div className={`${widget.bgColor} p-3 rounded-lg`}>
                <widget.icon className={`w-6 h-6 ${widget.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary" />
            Consultations Last 7 Days
          </h2>
          {consultationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={consultationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Consultations"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">No consultation data available</p>
            </div>
          )}
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FlaskConical className="w-5 h-5 mr-2 text-primary" />
            Lab Orders by Status
          </h2>
          {labStatusData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={labStatusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {labStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">No lab orders data available</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Recent Consultations
          </h2>
          {recentConsultations.length > 0 ? (
            <div className="space-y-2">
              {recentConsultations.map((consultation) => (
                <button
                  key={consultation.id}
                  onClick={() => navigate(`/portal/consultations/${consultation.id}`)}
                  className="w-full p-3 bg-slate-750 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {consultation.patient_name}
                    </span>
                    {getStatusBadge(consultation.status)}
                  </div>
                  <div className="flex items-center text-xs text-slate-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDateTime(consultation.consultation_date)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-400">No recent consultations</p>
            </div>
          )}
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FlaskConical className="w-5 h-5 mr-2 text-primary" />
            Recent Lab Orders
          </h2>
          {recentLabOrders.length > 0 ? (
            <div className="space-y-2">
              {recentLabOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/portal/lab-orders`)}
                  className="w-full p-3 bg-slate-750 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{order.patient_name}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-slate-400 mb-2 truncate">{order.test_names}</p>
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDateTime(order.created_at)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-400">No recent lab orders</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
