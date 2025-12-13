import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { 
  FlaskConical, 
  Calendar, 
  Clock, 
  Home,
  Building,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

interface LabOrder {
  id: string;
  organization_id: string;
  patient_id: string;
  order_date: string;
  booking_type: string;
  status: string;
  report_status: string;
  test_ids: any;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  created_at: string;
  patient?: {
    id: string;
    full_name: string;
    gender: string;
    age: number;
    phone: string;
  };
}

export const LabOrdersList = () => {
  const { organization } = useAuthStore();
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');

  useEffect(() => {
    if (organization?.id) {
      fetchLabOrders();
    }
  }, [organization?.id]);

  const fetchLabOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patient:patients(id, full_name, gender, age, phone)
        `)
        .eq('organization_id', organization?.id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setLabOrders(data || []);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getTestCount = (testIds: any): number => {
    if (!testIds) return 0;
    if (Array.isArray(testIds)) return testIds.length;
    try {
      const parsed = typeof testIds === 'string' ? JSON.parse(testIds) : testIds;
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const getTestNames = (testIds: any): string[] => {
    if (!testIds) return [];
    if (Array.isArray(testIds)) return testIds;
    try {
      const parsed = typeof testIds === 'string' ? JSON.parse(testIds) : testIds;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const safeStatus = status || 'unknown';
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <Clock className="w-3 h-3" /> },
      confirmed: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <CheckCircle className="w-3 h-3" /> },
      sample_collected: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: <FlaskConical className="w-3 h-3" /> },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <XCircle className="w-3 h-3" /> },
      unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: <AlertCircle className="w-3 h-3" /> }
    };
    const config = statusConfig[safeStatus] || statusConfig.unknown;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {safeStatus.replace(/_/g, ' ')}
      </span>
    );
  };

  const getReportStatusBadge = (status: string | null | undefined) => {
    const safeStatus = status || 'unknown';
    const statusConfig: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      processing: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400' },
      delivered: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
      unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400' }
    };
    const config = statusConfig[safeStatus] || statusConfig.unknown;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <FileText className="w-3 h-3" />
        {safeStatus}
      </span>
    );
  };

  const getBookingTypeIcon = (type: string | null | undefined) => {
    const safeType = type || 'in_clinic';
    if (safeType === 'home_collection') {
      return <Home className="w-4 h-4 text-orange-400" />;
    }
    return <Building className="w-4 h-4 text-cyan-400" />;
  };

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = 
      (order.patient?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTestNames(order.test_ids).some(test => test.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesReport = reportFilter === 'all' || order.report_status === reportFilter;
    
    return matchesSearch && matchesStatus && matchesReport;
  });

  const totalAmount = labOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalPaid = labOrders.reduce((sum, order) => sum + (order.amount_paid || 0), 0);
  const totalDue = labOrders.reduce((sum, order) => sum + (order.balance_due || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Lab Orders</h1>
        <p className="text-slate-400 text-sm">Manage diagnostic test bookings and reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="sample_collected">Sample Collected</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={reportFilter}
          onChange={(e) => setReportFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Reports</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-white">{labOrders.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-yellow-400 text-xs mb-1">Pending</p>
          <p className="text-2xl font-bold text-white">
            {labOrders.filter(o => o.status === 'pending').length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-green-400 text-xs mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-cyan-400 text-xs mb-1">Amount Paid</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-red-400 text-xs mb-1">Balance Due</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalDue)}</p>
        </div>
      </div>

      {/* Lab Orders List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tests</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Report</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No lab orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-white text-sm">{formatDate(order.order_date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <span className="text-orange-400 text-sm font-medium">
                            {(order.patient?.full_name || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{order.patient?.full_name || 'Unknown'}</p>
                          <p className="text-slate-500 text-xs">
                            {order.patient?.gender || ''} {order.patient?.age ? `• ${order.patient.age}y` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getBookingTypeIcon(order.booking_type)}
                        <span className="text-slate-300 text-sm capitalize">
                          {(order.booking_type || 'in_clinic').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{getTestCount(order.test_ids)} tests</p>
                        <p className="text-slate-500 text-xs truncate max-w-[150px]">
                          {getTestNames(order.test_ids).slice(0, 2).join(', ')}
                          {getTestCount(order.test_ids) > 2 && '...'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3">
                      {getReportStatusBadge(order.report_status)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{formatCurrency(order.total_amount)}</p>
                        {(order.balance_due || 0) > 0 && (
                          <p className="text-red-400 text-xs">Due: {formatCurrency(order.balance_due)}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};