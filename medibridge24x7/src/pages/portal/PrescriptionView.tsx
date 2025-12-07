import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Printer, Pill } from 'lucide-react';
import toast from 'react-hot-toast';

interface Prescription {
  id: string;
  organization_id: string;
  patient_id: string;
  doctor_id: string;
  prescription_date: string;
  notes?: string;
}

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

interface Patient {
  full_name: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
}

interface Doctor {
  full_name: string;
}

interface Organization {
  name: string;
}

export const PrescriptionView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [orgInfo, setOrgInfo] = useState<Organization | null>(null);

  useEffect(() => {
    if (id && organization?.id) {
      loadPrescriptionData();
    }
  }, [id, organization?.id]);

  const loadPrescriptionData = async () => {
    try {
      setIsLoading(true);

      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', id!)
        .eq('organization_id', organization!.id)
        .maybeSingle();

      if (prescriptionError) throw prescriptionError;

      if (!prescriptionData) {
        toast.error('Prescription not found');
        navigate('/portal/patients');
        return;
      }

      setPrescription(prescriptionData);

      const [itemsResult, patientResult, staffResult, orgResult] = await Promise.all([
        supabase
          .from('prescription_items')
          .select('*')
          .eq('prescription_id', id!)
          .order('created_at'),
        supabase
          .from('patients')
          .select('full_name, age, gender, phone, address')
          .eq('id', prescriptionData.patient_id)
          .maybeSingle(),
        supabase
          .from('org_staff')
          .select('user_id')
          .eq('id', prescriptionData.doctor_id)
          .maybeSingle(),
        supabase
          .from('organizations')
          .select('name')
          .eq('id', organization!.id)
          .maybeSingle(),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (patientResult.error) throw patientResult.error;
      if (orgResult.error) throw orgResult.error;

      setItems(itemsResult.data || []);
      setPatient(patientResult.data);
      setOrgInfo(orgResult.data);

      if (staffResult.data?.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', staffResult.data.user_id)
          .maybeSingle();

        setDoctor(userData || { full_name: 'Unknown Doctor' });
      }
    } catch (error: any) {
      console.error('Error loading prescription:', error);
      toast.error('Failed to load prescription');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (!prescription || !patient || !doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Prescription not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors"
        >
          <Printer className="w-5 h-5 mr-2" />
          Print
        </button>
      </div>

      <div className="bg-white text-slate-900 rounded-lg shadow-lg overflow-hidden print:shadow-none">
        <div className="border-b-2 border-slate-900 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {orgInfo?.name || 'Medical Clinic'}
                  </h1>
                  <p className="text-sm text-slate-600">Medical Prescription</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-600 uppercase tracking-wider mb-1">
                Prescription ID
              </div>
              <div className="text-sm font-mono text-slate-900">{prescription.id.slice(0, 8)}</div>
              <div className="text-xs text-slate-600 mt-2">
                Date: {new Date(prescription.prescription_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-slate-600 uppercase tracking-wider mb-2 font-semibold">
                Patient Information
              </div>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="font-semibold">Name:</span> {patient.full_name}
                </div>
                {patient.age && (
                  <div className="text-sm">
                    <span className="font-semibold">Age:</span> {patient.age} years
                  </div>
                )}
                {patient.gender && (
                  <div className="text-sm">
                    <span className="font-semibold">Gender:</span>{' '}
                    {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  </div>
                )}
                {patient.phone && (
                  <div className="text-sm">
                    <span className="font-semibold">Phone:</span> {patient.phone}
                  </div>
                )}
                {patient.address && (
                  <div className="text-sm">
                    <span className="font-semibold">Address:</span> {patient.address}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-600 uppercase tracking-wider mb-2 font-semibold">
                Prescribing Doctor
              </div>
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="font-semibold">Dr. {doctor.full_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary bg-opacity-10 rounded flex items-center justify-center">
                <span className="text-primary font-bold">Rx</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Prescription</h2>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-slate-300 rounded-lg p-4 bg-slate-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-base mb-1">
                        {index + 1}. {item.medicine_name}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-700">
                        {item.dosage && (
                          <div>
                            <span className="font-medium">Dosage:</span> {item.dosage}
                          </div>
                        )}
                        {item.frequency && (
                          <div>
                            <span className="font-medium">Frequency:</span> {item.frequency}
                          </div>
                        )}
                        {item.duration && (
                          <div>
                            <span className="font-medium">Duration:</span> {item.duration}
                          </div>
                        )}
                        {item.instructions && (
                          <div className="col-span-2">
                            <span className="font-medium">Instructions:</span> {item.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {prescription.notes && (
            <div className="border-t border-slate-300 pt-6 mt-6">
              <div className="text-xs text-slate-600 uppercase tracking-wider mb-2 font-semibold">
                Additional Notes
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{prescription.notes}</p>
            </div>
          )}

          <div className="border-t border-slate-300 pt-8 mt-8">
            <div className="flex items-end justify-between">
              <div className="text-xs text-slate-600">
                <p>This is a computer-generated prescription.</p>
                <p className="mt-1">Valid for 30 days from date of issue.</p>
              </div>
              <div className="text-right">
                <div className="w-48 border-t-2 border-slate-900 pt-2">
                  <div className="text-sm font-semibold text-slate-900">
                    Dr. {doctor.full_name}
                  </div>
                  <div className="text-xs text-slate-600">Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white px-8 py-4 text-center text-xs">
          <p>{orgInfo?.name || 'Medical Clinic'}</p>
          <p className="mt-1 text-slate-400">
            For any queries, please contact your healthcare provider
          </p>
        </div>
      </div>
    </div>
  );
};
