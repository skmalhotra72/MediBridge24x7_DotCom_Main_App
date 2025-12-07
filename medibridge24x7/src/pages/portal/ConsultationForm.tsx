import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Save, Pill, FlaskConical, List } from 'lucide-react';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  full_name: string;
}

interface Doctor {
  id: string;
  full_name: string;
}

interface FormData {
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  chief_complaint: string;
  diagnosis: string;
  notes: string;
  status: string;
  follow_up_date: string;
}

export const ConsultationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { organization, user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [savedConsultationId, setSavedConsultationId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    patient_id: searchParams.get('patientId') || '',
    doctor_id: '',
    consultation_date: new Date().toISOString().slice(0, 16),
    chief_complaint: '',
    diagnosis: '',
    notes: '',
    status: 'scheduled',
    follow_up_date: '',
  });

  useEffect(() => {
    if (organization?.id) {
      loadPatients();
      loadDoctors();
      if (id) {
        loadConsultation();
      }
    }
  }, [organization?.id, id]);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('organization_id', organization!.id)
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    }
  };

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
            full_name: userData?.full_name || 'Unknown Doctor',
          };
        })
      );

      setDoctors(doctorsWithNames);

      if (!id && doctorsWithNames.length > 0) {
        const currentStaff = await supabase
          .from('org_staff')
          .select('id')
          .eq('organization_id', organization!.id)
          .eq('user_id', user!.id)
          .maybeSingle();

        if (currentStaff.data) {
          setFormData((prev) => ({ ...prev, doctor_id: currentStaff.data.id }));
        }
      }
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const loadConsultation = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', id!)
        .eq('organization_id', organization!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Consultation not found');
        navigate('/portal/consultations');
        return;
      }

      setFormData({
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        consultation_date: data.consultation_date.slice(0, 16),
        chief_complaint: data.chief_complaint || '',
        diagnosis: data.diagnosis || '',
        notes: data.notes || '',
        status: data.status,
        follow_up_date: data.follow_up_date ? data.follow_up_date.slice(0, 16) : '',
      });
    } catch (error: any) {
      console.error('Error loading consultation:', error);
      toast.error('Failed to load consultation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id) {
      toast.error('Please select a patient');
      return;
    }

    if (!formData.doctor_id) {
      toast.error('Please select a doctor');
      return;
    }

    if (!formData.consultation_date) {
      toast.error('Please select a consultation date');
      return;
    }

    try {
      setIsSubmitting(true);

      const consultationData = {
        organization_id: organization!.id,
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        consultation_date: formData.consultation_date,
        chief_complaint: formData.chief_complaint.trim() || null,
        diagnosis: formData.diagnosis.trim() || null,
        notes: formData.notes.trim() || null,
        status: formData.status,
        follow_up_date: formData.follow_up_date || null,
      };

      if (id) {
        const { error } = await supabase
          .from('consultations')
          .update(consultationData)
          .eq('id', id);

        if (error) throw error;

        toast.success('Consultation updated successfully');
        setSavedConsultationId(id);
      } else {
        const { data, error } = await supabase
          .from('consultations')
          .insert([consultationData])
          .select()
          .single();

        if (error) throw error;

        toast.success('Consultation created successfully');
        setSavedConsultationId(data.id);
      }
    } catch (error: any) {
      console.error('Error saving consultation:', error);
      toast.error(error.message || 'Failed to save consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatient = patients.find((p) => p.id === formData.patient_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (savedConsultationId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="w-8 h-8 text-green-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Consultation {id ? 'Updated' : 'Created'} Successfully
          </h2>
          <p className="text-slate-400 mb-6">What would you like to do next?</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => navigate(`/portal/consultations/${savedConsultationId}/prescription`)}
              className="flex flex-col items-center p-6 bg-slate-900 hover:bg-slate-750 border border-slate-700 hover:border-primary rounded-lg transition-all group"
            >
              <div className="w-12 h-12 bg-green-900 group-hover:bg-primary rounded-full flex items-center justify-center mb-3 transition-colors">
                <Pill className="w-6 h-6 text-green-300 group-hover:text-white" />
              </div>
              <span className="text-sm font-medium text-white mb-1">Add Prescription</span>
              <span className="text-xs text-slate-400">Create prescription for this visit</span>
            </button>

            <button
              onClick={() => navigate(`/portal/consultations/${savedConsultationId}/lab-order`)}
              className="flex flex-col items-center p-6 bg-slate-900 hover:bg-slate-750 border border-slate-700 hover:border-primary rounded-lg transition-all group"
            >
              <div className="w-12 h-12 bg-purple-900 group-hover:bg-primary rounded-full flex items-center justify-center mb-3 transition-colors">
                <FlaskConical className="w-6 h-6 text-purple-300 group-hover:text-white" />
              </div>
              <span className="text-sm font-medium text-white mb-1">Order Lab Tests</span>
              <span className="text-xs text-slate-400">Request lab work for patient</span>
            </button>

            <button
              onClick={() => navigate('/portal/consultations')}
              className="flex flex-col items-center p-6 bg-slate-900 hover:bg-slate-750 border border-slate-700 hover:border-primary rounded-lg transition-all group"
            >
              <div className="w-12 h-12 bg-blue-900 group-hover:bg-primary rounded-full flex items-center justify-center mb-3 transition-colors">
                <List className="w-6 h-6 text-blue-300 group-hover:text-white" />
              </div>
              <span className="text-sm font-medium text-white mb-1">Back to List</span>
              <span className="text-xs text-slate-400">Return to consultations</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/portal/consultations')}
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Consultations
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">
            {id ? 'Edit Consultation' : 'New Consultation'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {id ? 'Update consultation details' : 'Create a new patient consultation'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Patient <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedPatient?.full_name || searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  placeholder="Search patient by name..."
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowPatientDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, patient_id: patient.id });
                            setSearchQuery('');
                            setShowPatientDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-slate-800 transition-colors"
                        >
                          {patient.full_name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Doctor <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Consultation Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.consultation_date}
                onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Chief Complaint
            </label>
            <textarea
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              rows={3}
              placeholder="Enter patient's main complaint or reason for visit..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Diagnosis</label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              placeholder="Enter diagnosis or assessment..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Clinical Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={5}
              placeholder="Enter detailed clinical notes, observations, treatment plan, etc..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Follow-up Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => navigate('/portal/consultations')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : id ? 'Update Consultation' : 'Create Consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
