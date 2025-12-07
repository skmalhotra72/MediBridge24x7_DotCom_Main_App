import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { Plus, Edit, Eye, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  status: string;
  patient_name?: string;
  doctor_name?: string;
}

interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
}

export const ConsultationsList = () => {
  const navigate = useNavigate();
  const { organization } = useAuthStore();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    doctorId: '',
  });
  const itemsPerPage = 20;

  useEffect(() => {
    if (organization?.id) {
      loadDoctors();
      loadConsultations();
    }
  }, [organization?.id, currentPage, filters]);

  const loadDoctors = async () => {
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('org_staff')
        .select('id, user_id')
        .eq('organization_id', organization!.id)
        .eq('role', 'doctor');

      if (staffError) throw staffError;

      const doctorsWithNames = await Promise.all(
        (staffData || []).map(async (staff) => {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', staff.user_id)
            .maybeSingle();

          return {
            id: staff.id,
            user_id: staff.user_id,
            full_name: userData?.full_name || 'Unknown Doctor',
          };
        })
      );

      setDoctors(doctorsWithNames);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadConsultations = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('consultations')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization!.id)
        .order('consultation_date', { ascending: false });

      if (filters.dateFrom) {
        query = query.gte('consultation_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('consultation_date', filters.dateTo);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const consultationsWithDetails = await Promise.all(
        (data || []).map(async (consultation) => {
          const { data: patientData } = await supabase
            .from('patients')
            .select('full_name')
            .eq('id', consultation.patient_id)
            .maybeSingle();

          const doctor = doctors.find((d) => d.id === consultation.doctor_id);

          return {
            ...consultation,
            patient_name: patientData?.full_name || 'Unknown Patient',
            doctor_name: doctor?.full_name || 'Unknown Doctor',
          };
        })
      );

      setConsultations(consultationsWithDetails);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error loading consultations:', error);
      toast.error('Failed to load consultations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: '',
      doctorId: '',
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-900 text-blue-300 border-blue-700',
      completed: 'bg-green-900 text-green-300 border-green-700',
      cancelled: 'bg-red-900 text-red-300 border-red-700',
      in_progress: 'bg-amber-900 text-amber-300 border-amber-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.scheduled
        }`}
      >
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.status || filters.doctorId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Consultations</h1>
          <p className="text-slate-400">Manage patient consultations and medical records</p>
        </div>
        <button
          onClick={() => navigate('/portal/consultations/new')}
          className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Consultation
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-white">Filters</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary hover:text-opacity-80 ml-auto"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Doctor</label>
            <select
              value={filters.doctorId}
              onChange={(e) => handleFilterChange('doctorId', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            >
              <option value="">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-400">Loading consultations...</p>
          </div>
        </div>
      ) : consultations.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 mb-2">
            {hasActiveFilters ? 'No consultations match your filters' : 'No consultations yet'}
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filter criteria'
              : 'Get started by creating your first consultation'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => navigate('/portal/consultations/new')}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Consultation
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
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Chief Complaint
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
                  {consultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">
                          {new Date(consultation.consultation_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(consultation.consultation_date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{consultation.patient_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{consultation.doctor_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">
                          {consultation.chief_complaint ? (
                            consultation.chief_complaint.length > 50 ? (
                              <span title={consultation.chief_complaint}>
                                {consultation.chief_complaint.substring(0, 50)}...
                              </span>
                            ) : (
                              consultation.chief_complaint
                            )
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(consultation.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              navigate(`/portal/patients/${consultation.patient_id}`)
                            }
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-300 bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Patient
                          </button>
                          <button
                            onClick={() => navigate(`/portal/consultations/${consultation.id}`)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-300 bg-green-900 hover:bg-green-800 border border-green-700 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
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
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} consultations
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
