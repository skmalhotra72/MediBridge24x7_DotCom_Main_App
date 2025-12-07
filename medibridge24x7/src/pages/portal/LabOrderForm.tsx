import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Save, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
}

interface LabTest {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export const LabOrderForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultationId = searchParams.get('consultationId');
  const { organization, user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id, consultationId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [patientsResult, testsResult] = await Promise.all([
        supabase
          .from('patients')
          .select('id, full_name, age, gender')
          .eq('organization_id', organization!.id)
          .order('full_name'),
        supabase
          .from('lab_tests')
          .select('id, name, code, description')
          .eq('is_active', true)
          .or(`organization_id.is.null,organization_id.eq.${organization!.id}`)
          .order('name'),
      ]);

      if (patientsResult.error) throw patientsResult.error;
      if (testsResult.error) throw testsResult.error;

      setPatients(patientsResult.data || []);
      setLabTests(testsResult.data || []);

      const currentStaff = await supabase
        .from('org_staff')
        .select('id')
        .eq('organization_id', organization!.id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (currentStaff.data) {
        setDoctorId(currentStaff.data.id);
      }

      if (consultationId) {
        const { data: consultationData, error: consultationError } = await supabase
          .from('consultations')
          .select('patient_id, doctor_id')
          .eq('id', consultationId)
          .eq('organization_id', organization!.id)
          .maybeSingle();

        if (consultationError) throw consultationError;

        if (consultationData) {
          setPatientId(consultationData.patient_id);
          setDoctorId(consultationData.doctor_id);

          const patientData = patientsResult.data?.find(
            (p) => p.id === consultationData.patient_id
          );
          setPatient(patientData || null);
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestToggle = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast.error('Please select a patient');
      return;
    }

    if (!doctorId) {
      toast.error('Doctor information is required');
      return;
    }

    if (selectedTestIds.length === 0) {
      toast.error('Please select at least one lab test');
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedTests = labTests
        .filter((test) => selectedTestIds.includes(test.id))
        .map((test) => test.name)
        .join(', ');

      const labOrderData = {
        organization_id: organization!.id,
        patient_id: patientId,
        doctor_id: doctorId,
        test_ids: selectedTestIds,
        test_names: selectedTests,
        status: 'pending',
        special_instructions: specialInstructions.trim() || null,
      };

      const { data, error } = await supabase
        .from('lab_orders')
        .insert([labOrderData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lab order created successfully');

      if (consultationId) {
        navigate(`/portal/patients/${patientId}`);
      } else {
        navigate('/portal/lab-orders');
      }
    } catch (error: any) {
      console.error('Error creating lab order:', error);
      toast.error(error.message || 'Failed to create lab order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatient = patients.find((p) => p.id === patientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">New Lab Order</h2>
          <p className="text-sm text-slate-400 mt-1">Order laboratory tests for a patient</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {patient ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                Patient Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Name</div>
                  <div className="text-sm font-medium text-white">{patient.full_name}</div>
                </div>
                {patient.age && (
                  <div>
                    <div className="text-xs text-slate-500">Age</div>
                    <div className="text-sm font-medium text-white">{patient.age} years</div>
                  </div>
                )}
                {patient.gender && (
                  <div>
                    <div className="text-xs text-slate-500">Gender</div>
                    <div className="text-sm font-medium text-white">
                      {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
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
                            setPatientId(patient.id);
                            setPatient(patient);
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
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-white">
                  Select Lab Tests <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mt-1">
                  Choose one or more tests to order
                </p>
              </div>
              <span className="text-sm text-slate-400">
                {selectedTestIds.length} test(s) selected
              </span>
            </div>

            {labTests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
                <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No lab tests available</p>
                <p className="text-sm text-slate-500 mt-1">
                  Please contact your administrator to add lab tests
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {labTests.map((test) => (
                  <label
                    key={test.id}
                    className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTestIds.includes(test.id)
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTestIds.includes(test.id)}
                      onChange={() => handleTestToggle(test.id)}
                      className="mt-1 w-5 h-5 text-primary bg-slate-800 border-slate-600 rounded focus:ring-primary focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">{test.name}</span>
                        {test.code && (
                          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {test.code}
                          </span>
                        )}
                      </div>
                      {test.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {test.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={4}
              placeholder="Enter any special instructions for the lab tests (e.g., fasting required, timing requirements, etc.)..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTestIds.length === 0}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Lab Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
