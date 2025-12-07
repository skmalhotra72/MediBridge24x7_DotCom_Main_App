import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Save, Plus, Trash2, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface MedicineItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Patient {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
}

interface Doctor {
  id: string;
  full_name: string;
}

export const PrescriptionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultationId = searchParams.get('consultationId');
  const { organization, user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([
    {
      medicine_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    },
  ]);

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id, consultationId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

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

          const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .select('id, full_name, age, gender')
            .eq('id', consultationData.patient_id)
            .maybeSingle();

          if (patientError) throw patientError;

          setPatient(patientData);
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const addMedicineItem = () => {
    setMedicineItems([
      ...medicineItems,
      {
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const removeMedicineItem = (index: number) => {
    if (medicineItems.length > 1) {
      setMedicineItems(medicineItems.filter((_, i) => i !== index));
    } else {
      toast.error('At least one medicine is required');
    }
  };

  const updateMedicineItem = (index: number, field: keyof MedicineItem, value: string) => {
    const updated = [...medicineItems];
    updated[index][field] = value;
    setMedicineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast.error('Patient information is required');
      return;
    }

    if (!doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    const validMedicines = medicineItems.filter((item) => item.medicine_name.trim());

    if (validMedicines.length === 0) {
      toast.error('Please add at least one medicine');
      return;
    }

    try {
      setIsSubmitting(true);

      const prescriptionData = {
        organization_id: organization!.id,
        patient_id: patientId,
        doctor_id: doctorId,
        prescription_date: prescriptionDate,
        notes: notes.trim() || null,
      };

      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert([prescriptionData])
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      const itemsData = validMedicines.map((item) => ({
        prescription_id: prescription.id,
        medicine_name: item.medicine_name.trim(),
        dosage: item.dosage.trim() || null,
        frequency: item.frequency.trim() || null,
        duration: item.duration.trim() || null,
        instructions: item.instructions.trim() || null,
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      toast.success('Prescription created successfully');

      if (consultationId) {
        navigate(`/portal/patients/${patientId}`);
      } else {
        navigate(`/portal/prescriptions/${prescription.id}`);
      }
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast.error(error.message || 'Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="text-xl font-semibold text-white">New Prescription</h2>
          <p className="text-sm text-slate-400 mt-1">Create a new prescription for the patient</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {patient && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                Patient Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Name</div>
                    <div className="text-sm font-medium text-white">{patient.full_name}</div>
                  </div>
                </div>
                {patient.age && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Age</div>
                      <div className="text-sm font-medium text-white">{patient.age} years</div>
                    </div>
                  </div>
                )}
                {patient.gender && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-500">Gender</div>
                      <div className="text-sm font-medium text-white">
                        {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Doctor <span className="text-red-400">*</span>
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prescription Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={prescriptionDate}
                onChange={(e) => setPrescriptionDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prescription Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Enter any special instructions or notes for the prescription..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-white">
                  Medicines <span className="text-red-400">*</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Add at least one medicine</p>
              </div>
              <button
                type="button"
                onClick={addMedicineItem}
                className="inline-flex items-center px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </button>
            </div>

            <div className="space-y-4">
              {medicineItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-white">Medicine #{index + 1}</span>
                    {medicineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicineItem(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-400 mb-2">
                        Medicine Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.medicine_name}
                        onChange={(e) =>
                          updateMedicineItem(index, 'medicine_name', e.target.value)
                        }
                        placeholder="e.g., Amoxicillin 500mg"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Dosage</label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={(e) => updateMedicineItem(index, 'dosage', e.target.value)}
                        placeholder="e.g., 1 tablet"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Frequency</label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={(e) => updateMedicineItem(index, 'frequency', e.target.value)}
                        placeholder="e.g., 3 times daily"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Duration</label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => updateMedicineItem(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Instructions</label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) =>
                          updateMedicineItem(index, 'instructions', e.target.value)
                        }
                        placeholder="e.g., After meals"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
