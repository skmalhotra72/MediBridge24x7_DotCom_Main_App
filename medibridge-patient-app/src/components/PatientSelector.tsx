'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, User, Plus, Check, Loader2, Users, Calendar, Heart } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface Patient {
  id: string;
  auth_user_id: string;
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  age: number | null;
  age_unit: string;
  relationship: string;
  blood_group: string | null;
  known_allergies: string[];
  chronic_conditions: string[];
  health_summary: string | null;
  last_summary_update: string | null;
  created_at: string;
  // For backwards compatibility in UI
  patient_name?: string;
}

interface PatientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientSelected: (patient: Patient) => void;
  userId: string;
  organizationId?: string;
}

// ============================================================
// PATIENT SELECTOR MODAL
// ============================================================

export default function PatientSelector({ 
  isOpen, 
  onClose, 
  onPatientSelected, 
  userId,
  organizationId 
}: PatientSelectorProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // New patient form state
  const [newPatient, setNewPatient] = useState({
    patient_name: '',
    gender: '',
    date_of_birth: '',
    age: '',
    relationship: 'self'
  });
  const [useAge, setUseAge] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  // Fetch existing patients
  useEffect(() => {
    if (isOpen && userId) {
      fetchPatients();
    }
  }, [isOpen, userId]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('auth_user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
      
      // If only one patient (self), auto-select
      if (data && data.length === 1) {
        setSelectedPatient(data[0]);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new patient
  const handleCreatePatient = async () => {
    if (!newPatient.patient_name.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!newPatient.gender) {
      setError('Please select gender');
      return;
    }
    if (!useAge && !newPatient.date_of_birth) {
      setError('Please enter date of birth or age');
      return;
    }
    if (useAge && !newPatient.age) {
      setError('Please enter age');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const patientData: any = {
        auth_user_id: userId,
        organization_id: organizationId,
        full_name: newPatient.patient_name.trim(),
        gender: newPatient.gender,
        relationship: newPatient.relationship
      };

      if (useAge) {
        patientData.age = parseInt(newPatient.age);
        patientData.age_unit = 'years';
      } else {
        patientData.date_of_birth = newPatient.date_of_birth;
        // Calculate age from DOB
        const dob = new Date(newPatient.date_of_birth);
        const today = new Date();
        const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        patientData.age = age;
      }

      const { data, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (error) throw error;

      // Add to list and select
      setPatients(prev => [data, ...prev]);
      setSelectedPatient(data);
      setShowCreateForm(false);
      
      // Reset form
      setNewPatient({
        patient_name: '',
        gender: '',
        date_of_birth: '',
        age: '',
        relationship: 'self'
      });

    } catch (err: any) {
      console.error('Error creating patient:', err);
      setError(err.message || 'Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedPatient) {
      onPatientSelected(selectedPatient);
      onClose();
    }
  };

  // Calculate age display
  const getAgeDisplay = (patient: Patient) => {
    if (patient.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      const today = new Date();
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return `${age} years`;
    }
    if (patient.age) {
      return `${patient.age} ${patient.age_unit || 'years'}`;
    }
    return 'Age not specified';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                      rounded-2xl w-full max-w-xl md:max-w-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/10
                      max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-8 py-5 border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-xl">
                  {showCreateForm ? 'Add New Patient' : 'Select Patient'}
                </h3>
                <p className="text-blue-300 text-sm">
                  {showCreateForm ? 'Enter patient details' : 'Who is this consultation for?'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
          ) : showCreateForm ? (
            // Create New Patient Form
            <div className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-5 py-3 rounded-lg text-base">
                  {error}
                </div>
              )}

              {/* Patient Name */}
              <div>
                <label className="block text-slate-300 text-base font-medium mb-3">
                  Patient Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newPatient.patient_name}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, patient_name: e.target.value }))}
                  placeholder="Enter full name"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-5 py-4 text-white 
                           placeholder-slate-500 text-base
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-slate-300 text-base font-medium mb-3">
                  Gender <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setNewPatient(prev => ({ ...prev, gender }))}
                      className={`px-5 py-3.5 rounded-xl text-base font-medium transition-all
                                ${newPatient.gender === gender
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* DOB / Age Toggle */}
              <div>
                <label className="block text-slate-300 text-base font-medium mb-3">
                  Date of Birth / Age <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setUseAge(false)}
                    className={`flex-1 px-5 py-3 rounded-xl text-base font-medium transition-all
                              ${!useAge
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                  >
                    Date of Birth
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseAge(true)}
                    className={`flex-1 px-5 py-3 rounded-xl text-base font-medium transition-all
                              ${useAge
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                  >
                    Enter Age
                  </button>
                </div>
                
                {useAge ? (
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Age"
                      min="0"
                      max="150"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-5 py-4 text-white 
                               placeholder-slate-500 text-base
                               focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                    <span className="flex items-center text-slate-400 text-base px-4">years</span>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={newPatient.date_of_birth}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-5 py-4 text-white 
                             text-base
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                )}
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-slate-300 text-base font-medium mb-3">
                  Relationship to You
                </label>
                <select
                  value={newPatient.relationship}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, relationship: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-5 py-4 text-white 
                           text-base
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                >
                  <option value="self">Self (It's me)</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setError('');
                  }}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-medium text-base rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePatient}
                  disabled={creating}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 
                           hover:from-blue-400 hover:to-purple-500
                           text-white font-semibold text-base rounded-xl
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Patient
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Patient Selection List
            <div className="space-y-5">
              {/* Add New Patient Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center gap-4 p-5 bg-slate-700/50 hover:bg-slate-700 
                         border-2 border-dashed border-slate-600 hover:border-blue-500/50
                         rounded-xl transition-all group"
              >
                <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center
                              group-hover:bg-blue-500/30 transition-colors">
                  <Plus className="w-7 h-7 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-lg">Add New Patient</p>
                  <p className="text-slate-400 text-base">Add a family member or friend</p>
                </div>
              </button>

              {/* Existing Patients */}
              {patients.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-slate-400 text-base font-medium px-1">Your Patients</p>
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`w-full flex items-center gap-4 p-5 rounded-xl transition-all text-left
                                ${selectedPatient?.id === patient.id
                                  ? 'bg-blue-500/20 border-2 border-blue-500'
                                  : 'bg-slate-700/50 hover:bg-slate-700 border-2 border-transparent'
                                }`}
                    >
                      {/* Avatar */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center
                                    ${selectedPatient?.id === patient.id
                                      ? 'bg-blue-500'
                                      : 'bg-slate-600'
                                    }`}>
                        {patient.relationship === 'self' ? (
                          <User className="w-7 h-7 text-white" />
                        ) : (
                          <Heart className="w-7 h-7 text-white" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-lg truncate">{patient.full_name || patient.patient_name}</p>
                          {patient.relationship !== 'self' && (
                            <span className="text-sm bg-slate-600 text-slate-300 px-3 py-1 rounded-full capitalize">
                              {patient.relationship}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-base">
                          {patient.gender} • {getAgeDisplay(patient)}
                        </p>
                      </div>
                      
                      {/* Check */}
                      {selectedPatient?.id === patient.id && (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No patients added yet</p>
                  <p className="text-slate-500 text-base">Click above to add yourself or a family member</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Confirm Button */}
        {!showCreateForm && patients.length > 0 && (
          <div className="p-8 border-t border-slate-700">
            <button
              onClick={handleConfirm}
              disabled={!selectedPatient}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 
                       hover:from-blue-400 hover:to-purple-500
                       text-white font-semibold text-lg rounded-xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all flex items-center justify-center gap-2"
            >
              Continue with {selectedPatient?.full_name || selectedPatient?.patient_name || 'Selected Patient'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// PATIENT INFO BADGE (For display in dashboard/chat)
// ============================================================

export function PatientInfoBadge({ patient }: { patient: Patient | null }) {
  if (!patient) return null;

  const getAgeDisplay = () => {
    if (patient.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      const today = new Date();
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return `${age}Y`;
    }
    if (patient.age) {
      return `${patient.age}Y`;
    }
    return '';
  };

  return (
    <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 
                    rounded-full px-3 py-1.5">
      <User className="w-4 h-4 text-blue-400" />
      <span className="text-blue-300 text-sm font-medium">{patient.full_name || patient.patient_name}</span>
      {patient.gender && (
        <span className="text-blue-400/70 text-xs">
          {patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'O'}
        </span>
      )}
      {getAgeDisplay() && (
        <span className="text-blue-400/70 text-xs">{getAgeDisplay()}</span>
      )}
    </div>
  );
}