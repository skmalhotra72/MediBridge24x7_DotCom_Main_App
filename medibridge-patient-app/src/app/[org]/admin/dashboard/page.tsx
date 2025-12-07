'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAnalyticsSummary, getRecentMessages, AnalyticsSummary } from '@/services/analyticsService';

// Stat Card Component
function StatCard({ title, value, icon, color }: {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ params }: { params: Promise<{ org: string }> }) {
  const [org, setOrg] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params;
        setOrg(resolvedParams.org);

        const supabase = createClient();
        
        // Get organization ID from subdomain
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('subdomain', resolvedParams.org)
          .single();

        if (orgData) {
          setOrganizationId(orgData.id);
          
          // Load analytics and messages
          const [analyticsData, messagesData] = await Promise.all([
            getAnalyticsSummary(orgData.id),
            getRecentMessages(orgData.id, 10)
          ]);

          setAnalytics(analyticsData);
          setRecentMessages(messagesData);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const today = analytics?.today || { 
    total_prescriptions: 0, 
    total_messages: 0, 
    total_lab_bookings: 0, 
    escalation_count: 0 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">MediBridge24x7 • {org}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Today's Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Prescriptions"
              value={today.total_prescriptions}
              icon="📋"
              color="text-blue-600"
            />
            <StatCard
              title="Messages"
              value={today.total_messages}
              icon="💬"
              color="text-purple-600"
            />
            <StatCard
              title="Lab Bookings"
              value={today.total_lab_bookings}
              icon="🔬"
              color="text-green-600"
            />
            <StatCard
              title="Escalations"
              value={today.escalation_count}
              icon="⚠️"
              color="text-red-600"
            />
          </div>
        </div>

        {/* Weekly Totals */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">This Week</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Prescriptions"
              value={analytics?.totals.prescriptions || 0}
              icon="📄"
              color="text-blue-600"
            />
            <StatCard
              title="Total Messages"
              value={analytics?.totals.messages || 0}
              icon="💬"
              color="text-purple-600"
            />
            <StatCard
              title="Lab Bookings"
              value={analytics?.totals.labBookings || 0}
              icon="🔬"
              color="text-green-600"
            />
            <StatCard
              title="Escalations"
              value={analytics?.totals.escalations || 0}
              icon="⚠️"
              color="text-red-600"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Messages */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Messages</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentMessages.length > 0 ? (
                recentMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-3 py-3 border-b last:border-0">
                    <span className="text-xl">
                      {msg.sender_type === 'ai' ? '🤖' : '👤'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {msg.message?.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent messages</p>
              )}
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Trend</h2>
            <div className="space-y-3">
              {(analytics?.thisWeek || []).map((day) => (
                <div key={day.date} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-blue-600">{day.total_prescriptions} Rx</span>
                    <span className="text-purple-600">{day.total_messages} msg</span>
                  </div>
                </div>
              ))}
              {(!analytics?.thisWeek || analytics.thisWeek.length === 0) && (
                <p className="text-gray-500 text-center py-8">No data yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}