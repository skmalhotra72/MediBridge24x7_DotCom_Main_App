import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
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

interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
  follow_up_date?: string;
  doctor_name?: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  prescription_date: string;
  notes?: string;
  doctor_name?: string;
  items?: PrescriptionItem[];
}

interface PrescriptionItem {
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_names: string;
  status: string;
  created_at: string;
  result_date?: string;
  doctor_name?: string;
}

const ConsultationCard = ({ consultation }: { consultation: Consultation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">Consultation</div>
            <div className="text-xs text-slate-400">
              {new Date(consultation.consultation_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-500">Doctor</div>
            <div className="text-sm text-white">{consultation.doctor_name || 'Unknown'}</div>
          </div>
        </div>

        {consultation.chief_complaint && (
          <div className="flex items-start space-x-2">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Chief Complaint</div>
              <div className="text-sm text-slate-300">{consultation.chief_complaint}</div>
            </div>
          </div>
        )}

        {isExpanded && (
          <>
            {consultation.diagnosis && (
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Diagnosis</div>
                  <div className="text-sm text-slate-300">{consultation.diagnosis}</div>
                </div>
              </div>
            )}

            {consultation.notes && (
              <div className="flex items-start space-x-2">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Notes</div>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap">
                    {consultation.notes}
                  </div>
                </div>
              </div>
            )}

            {consultation.follow_up_date && (
              <div className="flex items-start space-x-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Follow-up Date</div>
                  <div className="text-sm text-slate-300">
                    {new Date(consultation.follow_up_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center">
            <Pill className="w-5 h-5 text-green-300" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">Prescription</div>
            <div className="text-xs text-slate-400">
              {new Date(prescription.prescription_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-500">Prescribed by</div>
            <div className="text-sm text-white">{prescription.doctor_name || 'Unknown'}</div>
          </div>
        </div>

        {prescription.items && prescription.items.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-slate-500 mb-2">Medications</div>
            <div className="space-y-2">
              {prescription.items.slice(0, isExpanded ? undefined : 2).map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-800 border border-slate-700 rounded p-3 text-sm"
                >
                  <div className="font-medium text-white mb-1">{item.medicine_name}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    {item.dosage && (
                      <div>
                        <span className="text-slate-500">Dosage:</span> {item.dosage}
                      </div>
                    )}
                    {item.frequency && (
                      <div>
                        <span className="text-slate-500">Frequency:</span> {item.frequency}
                      </div>
                    )}
                    {item.duration && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Duration:</span> {item.duration}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!isExpanded && prescription.items.length > 2 && (
                <div className="text-xs text-slate-400">
                  +{prescription.items.length - 2} more medication(s)
                </div>
              )}
            </div>
          </div>
        )}

        {isExpanded && prescription.notes && (
          <div className="flex items-start space-x-2 mt-3">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Notes</div>
              <div className="text-sm text-slate-300 whitespace-pre-wrap">{prescription.notes}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LabOrderCard = ({ labOrder }: { labOrder: LabOrder }) => {
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

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-900 rounded-full flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">Lab Order</div>
            <div className="text-xs text-slate-400">
              {new Date(labOrder.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
        {getStatusBadge(labOrder.status)}
      </div>

      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-500">Ordered by</div>
            <div className="text-sm text-white">{labOrder.doctor_name || 'Unknown'}</div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <FlaskConical className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-500">Tests</div>
            <div className="text-sm text-slate-300">{labOrder.test_names}</div>
          </div>
        </div>

        {labOrder.result_date && (
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Result Date</div>
              <div className="text-sm text-slate-300">
                {new Date(labOrder.result_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization } = useAuthStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'consultations' | 'prescriptions' | 'lab_orders'>(
    'consultations'
  );

  useEffect(() => {
    if (id && organization?.id) {
      loadPatientData();
    }
  }, [id, organization?.id]);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id!)
        .eq('organization_id', organization!.id)
        .maybeSingle();

      if (patientError) throw patientError;

      if (!patientData) {
        toast.error('Patient not found');
        navigate('/portal/patients');
        return;
      }

      setPatient(patientData);

      const [consultationsResult, prescriptionsResult, labOrdersResult] = await Promise.all([
        supabase
          .from('consultations')
          .select('*')
          .eq('patient_id', id!)
          .order('consultation_date', { ascending: false }),
        supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', id!)
          .order('prescription_date', { ascending: false }),
        supabase
          .from('lab_orders')
          .select('*')
          .eq('patient_id', id!)
          .order('created_at', { ascending: false }),
      ]);

      if (consultationsResult.error) throw consultationsResult.error;
      if (prescriptionsResult.error) throw prescriptionsResult.error;
      if (labOrdersResult.error) throw labOrdersResult.error;

      const consultationsWithDoctors = await Promise.all(
        (consultationsResult.data || []).map(async (consultation) => {
          const { data: staffData } = await supabase
            .from('org_staff')
            .select('user_id')
            .eq('id', consultation.doctor_id)
            .maybeSingle();

          let doctorName = 'Unknown';
          if (staffData?.user_id) {
            const { data: userData } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', staffData.user_id)
              .maybeSingle();
            doctorName = userData?.email || 'Unknown';
          }

          return { ...consultation, doctor_name: doctorName };
        })
      );

      const prescriptionsWithDetails = await Promise.all(
        (prescriptionsResult.data || []).map(async (prescription) => {
          const { data: staffData } = await supabase
            .from('org_staff')
            .select('user_id')
            .eq('id', prescription.doctor_id)
            .maybeSingle();

          let doctorName = 'Unknown';
          if (staffData?.user_id) {
            const { data: userData } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', staffData.user_id)
              .maybeSingle();
            doctorName = userData?.email || 'Unknown';
          }

          const { data: itemsData } = await supabase
            .from('prescription_items')
            .select('*')
            .eq('prescription_id', prescription.id);

          return { ...prescription, doctor_name: doctorName, items: itemsData || [] };
        })
      );

      const labOrdersWithDoctors = await Promise.all(
        (labOrdersResult.data || []).map(async (labOrder) => {
          const { data: staffData } = await supabase
            .from('org_staff')
            .select('user_id')
            .eq('id', labOrder.doctor_id)
            .maybeSingle();

          let doctorName = 'Unknown';
          if (staffData?.user_id) {
            const { data: userData } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', staffData.user_id)
              .maybeSingle();
            doctorName = userData?.email || 'Unknown';
          }

          return { ...labOrder, doctor_name: doctorName };
        })
      );

      setConsultations(consultationsWithDoctors);
      setPrescriptions(prescriptionsWithDetails);
      setLabOrders(labOrdersWithDoctors);
    } catch (error: any) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Patient not found</p>
      </div>
    );
  }

  const getGenderDisplay = (gender?: string) => {
    if (!gender) return '-';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/portal/patients')}
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Patients
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-primary to-secondary p-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-1">
                {patient.full_name}
              </h2>
              <p className="text-white text-opacity-80 text-center text-sm">
                {patient.age ? `${patient.age} years old` : 'Age not specified'} •{' '}
                {getGenderDisplay(patient.gender)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  Contact Information
                </div>
                <div className="space-y-3">
                  {patient.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300 break-all">{patient.email}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{patient.address}</span>
                    </div>
                  )}
                  {!patient.phone && !patient.email && !patient.address && (
                    <p className="text-sm text-slate-500 italic">No contact information</p>
                  )}
                </div>
              </div>

              {patient.medical_history && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    Medical History
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded p-3">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {patient.medical_history}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  Patient Since
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">
                    {new Date(patient.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {patient.last_visit_date && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    Last Visit
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {new Date(patient.last_visit_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="border-b border-slate-700">
              <div className="flex space-x-1 p-1">
                <button
                  onClick={() => setActiveTab('consultations')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded transition-colors ${
                    activeTab === 'consultations'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  <FileText className="w-4 h-4 inline-block mr-2" />
                  Consultations ({consultations.length})
                </button>
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded transition-colors ${
                    activeTab === 'prescriptions'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  <Pill className="w-4 h-4 inline-block mr-2" />
                  Prescriptions ({prescriptions.length})
                </button>
                <button
                  onClick={() => setActiveTab('lab_orders')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded transition-colors ${
                    activeTab === 'lab_orders'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  <FlaskConical className="w-4 h-4 inline-block mr-2" />
                  Lab Orders ({labOrders.length})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'consultations' && (
                <div className="space-y-4">
                  {consultations.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">No consultations yet</p>
                      <p className="text-sm text-slate-500">
                        Start a new consultation to begin the patient's medical record
                      </p>
                    </div>
                  ) : (
                    consultations.map((consultation) => (
                      <ConsultationCard key={consultation.id} consultation={consultation} />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-4">
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <Pill className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">No prescriptions yet</p>
                      <p className="text-sm text-slate-500">
                        Prescriptions will appear here when issued
                      </p>
                    </div>
                  ) : (
                    prescriptions.map((prescription) => (
                      <PrescriptionCard key={prescription.id} prescription={prescription} />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'lab_orders' && (
                <div className="space-y-4">
                  {labOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <FlaskConical className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">No lab orders yet</p>
                      <p className="text-sm text-slate-500">Lab orders will appear here when ordered</p>
                    </div>
                  ) : (
                    labOrders.map((labOrder) => <LabOrderCard key={labOrder.id} labOrder={labOrder} />)
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate(`/portal/consultations/new?patientId=${patient.id}`)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-opacity-80 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
