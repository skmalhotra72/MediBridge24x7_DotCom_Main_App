import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { Button, TableSkeleton, EmptyState, ErrorState, Input } from '../../components';
import { Search, Plus, Eye, Calendar, ChevronLeft, ChevronRight, X, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  organization_id: string;
  full_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  medical_history?: string;
  created_at: string;
  last_visit_date?: string;
}

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
}

const AddPatientModal = ({ isOpen, onClose, onSuccess, organizationId }: AddPatientModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    medical_history: '',
  });

  const validatePatientForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Patient name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.length < 10) {
        newErrors.phone = 'Phone number must be at least 10 digits';
      }
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.age && (parseInt(formData.age) < 0 || parseInt(formData.age) > 150)) {
      newErrors.age = 'Please enter a valid age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePatientForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const patientData = {
        organization_id: organizationId,
        full_name: formData.full_name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        medical_history: formData.medical_history.trim() || null,
      };

      const { error } = await supabase.from('patients').insert([patientData]);

      if (error) throw error;

      toast.success('Patient added successfully');
      setFormData({
        full_name: '',
        age: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        medical_history: '',
      });
      setErrors({});
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast.error(error.message || 'Failed to add patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl my-4 sm:my-8 flex flex-col border border-slate-700">
        <div className="bg-slate-900 border-b border-slate-700 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Add New Patient</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                value={formData.full_name}
                onChange={(e) => {
                  setFormData({ ...formData, full_name: e.target.value });
                  clearError('full_name');
                }}
                error={errors.full_name}
                placeholder="Enter patient name"
                required
                disabled={isSubmitting}
              />

              <Input
                label="Age"
                type="number"
                min="0"
                max="150"
                value={formData.age}
                onChange={(e) => {
                  setFormData({ ...formData, age: e.target.value });
                  clearError('age');
                }}
                error={errors.age}
                placeholder="Enter age"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  clearError('phone');
                }}
                error={errors.phone}
                placeholder="Enter phone number"
                required
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                clearError('email');
              }}
              error={errors.email}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />

            <Input
              label="Address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
              disabled={isSubmitting}
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Medical History
              </label>
              <textarea
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                rows={4}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none disabled:opacity-50"
                placeholder="Enter relevant medical history, allergies, chronic conditions, etc."
              />
            </div>
          </div>
        </form>

        <div className="bg-slate-900 border-t border-slate-700 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 min-h-[44px]"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Patient'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const PatientsList = () => {
  const navigate = useNavigate();
  const { organization } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    if (organization?.id) {
      loadPatients();
    }
  }, [organization?.id, currentPage, searchQuery]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error: queryError, count } = await query.range(from, to);

      if (queryError) throw queryError;

      setPatients(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      setError(error.message || 'Failed to load patients');
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const getGenderBadge = (gender?: string) => {
    if (!gender) return <span className="text-slate-500 text-sm">-</span>;

    const colors = {
      male: 'bg-blue-900 text-blue-300 border-blue-700',
      female: 'bg-pink-900 text-pink-300 border-pink-700',
      other: 'bg-purple-900 text-purple-300 border-purple-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          colors[gender as keyof typeof colors] || 'bg-slate-700 text-slate-300 border-slate-600'
        }`}
      >
        {gender.charAt(0).toUpperCase() + gender.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Patients</h1>
          <p className="text-slate-400">Manage your patient records</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Patient
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Failed to load patients"
          message={error}
          onRetry={loadPatients}
        />
      ) : isLoading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={searchQuery ? Search : Users}
          title={searchQuery ? 'No patients found' : 'No patients yet'}
          description={
            searchQuery
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first patient'
          }
          action={
            !searchQuery
              ? {
                  label: 'Add Patient',
                  onClick: () => setIsAddModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-white">{patient.full_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">
                          {patient.age || <span className="text-slate-500">-</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getGenderBadge(patient.gender)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">
                          {patient.phone || <span className="text-slate-500">-</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">
                          {patient.last_visit_date ? (
                            new Date(patient.last_visit_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          ) : (
                            <span className="text-slate-500">No visits</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/portal/patients/${patient.id}`)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-300 bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/portal/consultations/new?patientId=${patient.id}`)
                            }
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-300 bg-green-900 hover:bg-green-800 border border-green-700 rounded-lg transition-colors"
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Consult
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">
                      {patient.full_name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                      {patient.age && <span>{patient.age} years</span>}
                      {patient.age && patient.gender && <span>•</span>}
                      {patient.gender && getGenderBadge(patient.gender)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {patient.phone && (
                    <div className="flex items-center space-x-2 text-slate-300">
                      <span className="text-slate-500">Phone:</span>
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.last_visit_date && (
                    <div className="flex items-center space-x-2 text-slate-300">
                      <span className="text-slate-500">Last Visit:</span>
                      <span>
                        {new Date(patient.last_visit_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-700">
                  <button
                    onClick={() => navigate(`/portal/patients/${patient.id}`)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-300 bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    View
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/portal/consultations/new?patientId=${patient.id}`)
                    }
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-300 bg-green-900 hover:bg-green-800 border border-green-700 rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Consult
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800 border border-slate-700 rounded-lg px-4 sm:px-6 py-4">
              <div className="text-xs sm:text-sm text-slate-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} patients
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs sm:text-sm text-slate-300 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadPatients}
        organizationId={organization!.id}
      />
    </div>
  );
};
