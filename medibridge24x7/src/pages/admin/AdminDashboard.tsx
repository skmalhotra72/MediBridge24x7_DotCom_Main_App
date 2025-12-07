import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MetricCard } from '../../components/MetricCard';
import { Building2, Users, AlertCircle, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Metrics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  pendingEscalations: number;
}

interface ChartData {
  month: string;
  count: number;
}

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    pendingEscalations: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const { count: totalOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const { count: activeOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalUsersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      setMetrics({
        totalOrganizations: totalOrgs || 0,
        activeOrganizations: activeOrgs || 0,
        totalUsers: totalUsersCount || 0,
        pendingEscalations: 0,
      });

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: orgsData } = await supabase
        .from('organizations')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      const monthCounts: { [key: string]: number } = {};
      const months = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });
        months.push(monthKey);
        monthCounts[monthKey] = 0;
      }

      orgsData?.forEach((org) => {
        const date = new Date(org.created_at);
        const monthKey = date.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });
        if (monthCounts[monthKey] !== undefined) {
          monthCounts[monthKey]++;
        }
      });

      const chartDataArray = months.map((month) => ({
        month,
        count: monthCounts[month],
      }));

      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">System-wide overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Building2}
          label="Total Organizations"
          value={metrics.totalOrganizations}
          isLoading={isLoading}
        />
        <MetricCard
          icon={Activity}
          label="Active Organizations"
          value={metrics.activeOrganizations}
          isLoading={isLoading}
          trend={{
            value: 12,
            isPositive: true,
          }}
        />
        <MetricCard
          icon={Users}
          label="Total Users"
          value={metrics.totalUsers}
          isLoading={isLoading}
        />
        <MetricCard
          icon={AlertCircle}
          label="Pending Escalations"
          value={metrics.pendingEscalations}
          isLoading={isLoading}
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-1">Organizations Created</h2>
          <p className="text-slate-400 text-sm">Last 6 months</p>
        </div>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                cursor={{ fill: '#334155' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              {
                action: 'New organization created',
                org: 'City General Hospital',
                time: '2 hours ago',
              },
              {
                action: 'User added to organization',
                org: 'Riverside Clinic',
                time: '5 hours ago',
              },
              {
                action: 'Settings updated',
                org: 'Metro Health Center',
                time: '1 day ago',
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-slate-900 rounded-lg"
              >
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{activity.action}</p>
                  <p className="text-xs text-slate-400 mt-1">{activity.org}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          <div className="space-y-4">
            {[
              { service: 'API Server', status: 'Operational', uptime: '99.9%' },
              { service: 'Database', status: 'Operational', uptime: '100%' },
              { service: 'Storage', status: 'Operational', uptime: '99.8%' },
              { service: 'Edge Functions', status: 'Operational', uptime: '99.7%' },
            ].map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                  <span className="text-sm font-medium text-white">{service.service}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary-400 font-medium">{service.status}</p>
                  <p className="text-xs text-slate-500">{service.uptime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
