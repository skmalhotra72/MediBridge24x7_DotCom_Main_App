import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { Plus, Upload, Eye, FlaskConical, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_names: string;
  status: string;
  created_at: string;
  special_instructions?: string;
  patient_name?: string;
  doctor_name?: string;
  has_report?: boolean;
}

export const LabOrdersList = () => {
  const navigate = useNavigate();
  const { organization } = useAuthStore();
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const itemsPerPage = 20;

  useEffect(() => {
    if (organization?.id) {
      loadLabOrders();
    }
  }, [organization?.id, currentPage, statusFilter]);

  const loadLabOrders = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('lab_orders')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const [patientResult, staffResult, reportResult] = await Promise.all([
            supabase
              .from('patients')
              .select('full_name')
              .eq('id', order.patient_id)
              .maybeSingle(),
            supabase.from('org_staff').select('user_id').eq('id', order.doctor_id).maybeSingle(),
            supabase
              .from('lab_reports')
              .select('id')
              .eq('lab_order_id', order.id)
              .maybeSingle(),
          ]);

          let doctorName = 'Unknown';
          if (staffResult.data?.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', staffResult.data.user_id)
              .maybeSingle();
            doctorName = userData?.full_name || 'Unknown';
          }

          return {
            ...order,
            patient_name: patientResult.data?.full_name || 'Unknown Patient',
            doctor_name: doctorName,
            has_report: !!reportResult.data,
          };
        })
      );

      setLabOrders(ordersWithDetails);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error loading lab orders:', error);
      toast.error('Failed to load lab orders');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-900 text-amber-300 border-amber-700',
      completed: 'bg-green-900 text-green-300 border-green-700',
      cancelled: 'bg-red-900 text-red-300 border-red-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const hasActiveFilters = !!statusFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lab Orders</h1>
          <p className="text-slate-400">Manage laboratory test orders and reports</p>
        </div>
        <button
          onClick={() => navigate('/portal/lab-orders/new')}
          className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Lab Order
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-white">Filters</span>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="text-xs text-primary hover:text-opacity-80 ml-auto"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-400">Loading lab orders...</p>
          </div>
        </div>
      ) : labOrders.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 mb-2">
            {hasActiveFilters ? 'No lab orders match your filters' : 'No lab orders yet'}
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filter criteria'
              : 'Get started by creating your first lab order'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => navigate('/portal/lab-orders/new')}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Lab Order
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Tests
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Ordered By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {labOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{order.patient_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">
                          {order.test_names.length > 50 ? (
                            <span title={order.test_names}>
                              {order.test_names.substring(0, 50)}...
                            </span>
                          ) : (
                            order.test_names
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{order.doctor_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(order.status)}
                          {order.has_report && (
                            <span className="text-xs text-green-400">Report Available</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/portal/patients/${order.patient_id}`)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-300 bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Patient
                          </button>
                          {order.status === 'pending' && !order.has_report && (
                            <button
                              onClick={() => navigate(`/portal/lab-orders/${order.id}/upload`)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-300 bg-green-900 hover:bg-green-800 border border-green-700 rounded-lg transition-colors"
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Upload Report
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-6 py-4">
              <div className="text-sm text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} lab orders
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
