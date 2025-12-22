'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/clinic-website/AdminLayout';

interface Doctor {
  id: string;
  organization_id: string;
  full_name: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  photo_url: string;
  bio: string;
  consultation_fee: number;
  available_days: string[];
  languages_spoken: string[];
  display_order: number;
  is_active: boolean;
}

const emptyDoctor: Partial<Doctor> = {
  full_name: '',
  specialization: '',
  qualifications: '',
  experience_years: 0,
  photo_url: '',
  bio: '',
  consultation_fee: 500,
  available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  languages_spoken: ['English', 'Hindi'],
  display_order: 0,
  is_active: true,
};

export default function DoctorsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const org = params.org as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDoctors = async (organizationId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('doctor_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });
    
    if (data) setDoctors(data);
  };

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${org}/auth`);
        return;
      }

      // Get organization
      const { data: organization } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', org)
        .single();

      if (!organization) {
        router.push(`/${org}/dashboard`);
        return;
      }

      setOrgName(organization.name);
      setOrgId(organization.id);
      await fetchDoctors(organization.id);
      setLoading(false);
    }

    fetchData();
  }, [org, router]);

  const handleAddDoctor = () => {
    setEditingDoctor({ ...emptyDoctor });
    setIsModalOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor({ ...doctor });
    setIsModalOpen(true);
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('doctor_profiles')
      .delete()
      .eq('id', doctorId);

    if (error) {
      setErrorMessage('Failed to delete doctor');
      return;
    }

    setSuccessMessage('Doctor deleted successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    await fetchDoctors(orgId);
  };

  const handleSaveDoctor = async () => {
    if (!editingDoctor) return;
    setSaving(true);
    setErrorMessage('');

    const supabase = createClient();

    try {
      if (editingDoctor.id) {
        // Update existing
        const { error } = await supabase
          .from('doctor_profiles')
          .update({
            full_name: editingDoctor.full_name,
            specialization: editingDoctor.specialization,
            qualifications: editingDoctor.qualifications,
            experience_years: editingDoctor.experience_years,
            photo_url: editingDoctor.photo_url,
            bio: editingDoctor.bio,
            consultation_fee: editingDoctor.consultation_fee,
            available_days: editingDoctor.available_days,
            languages_spoken: editingDoctor.languages_spoken,
            display_order: editingDoctor.display_order,
            is_active: editingDoctor.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDoctor.id);

        if (error) throw error;
        setSuccessMessage('Doctor updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('doctor_profiles')
          .insert({
            organization_id: orgId,
            full_name: editingDoctor.full_name,
            specialization: editingDoctor.specialization,
            qualifications: editingDoctor.qualifications,
            experience_years: editingDoctor.experience_years,
            photo_url: editingDoctor.photo_url,
            bio: editingDoctor.bio,
            consultation_fee: editingDoctor.consultation_fee,
            available_days: editingDoctor.available_days,
            languages_spoken: editingDoctor.languages_spoken,
            display_order: doctors.length,
            is_active: true,
          });

        if (error) throw error;
        setSuccessMessage('Doctor added successfully');
      }

      setTimeout(() => setSuccessMessage(''), 3000);
      setIsModalOpen(false);
      setEditingDoctor(null);
      await fetchDoctors(orgId);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const toggleDoctorStatus = async (doctor: Doctor) => {
    const supabase = createClient();
    await supabase
      .from('doctor_profiles')
      .update({ is_active: !doctor.is_active })
      .eq('id', doctor.id);
    
    await fetchDoctors(orgId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const commonLanguages = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi'];

  return (
    <AdminLayout orgSlug={org} orgName={orgName}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
          <p className="text-gray-500 mt-1">Add and manage doctor profiles for your clinic</p>
        </div>
        <button
          onClick={handleAddDoctor}
          className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Doctor
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Doctors List */}
      {doctors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors added yet</h3>
          <p className="text-gray-500 mb-6">Add your clinic's doctors to display them on your website</p>
          <button
            onClick={handleAddDoctor}
            className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Doctor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`bg-white rounded-xl border ${doctor.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'} overflow-hidden`}
            >
              {/* Doctor Photo */}
              <div className="h-48 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center relative">
                {doctor.photo_url ? (
                  <img
                    src={doctor.photo_url}
                    alt={doctor.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-purple-600">
                      {doctor.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                {!doctor.is_active && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800/80 text-white text-xs rounded">
                    Inactive
                  </div>
                )}
              </div>

              {/* Doctor Info */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg">{doctor.full_name}</h3>
                <p className="text-purple-600 text-sm mb-2">{doctor.specialization}</p>
                <p className="text-gray-500 text-sm mb-3">{doctor.qualifications}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>{doctor.experience_years} years exp.</span>
                  <span>₹{doctor.consultation_fee}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEditDoctor(doctor)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleDoctorStatus(doctor)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      doctor.is_active
                        ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                        : 'text-green-600 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    {doctor.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteDoctor(doctor.id)}
                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && editingDoctor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDoctor.id ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDoctor(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={editingDoctor.full_name || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, full_name: e.target.value })}
                    placeholder="Dr. Vikram Sharma"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
                  <input
                    type="text"
                    value={editingDoctor.specialization || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                    placeholder="General Medicine & Family Physician"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                  <input
                    type="text"
                    value={editingDoctor.qualifications || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, qualifications: e.target.value })}
                    placeholder="MBBS, MD (General Medicine)"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={editingDoctor.experience_years || 0}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, experience_years: parseInt(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={editingDoctor.consultation_fee || 500}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, consultation_fee: parseInt(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo URL</label>
                  <input
                    type="url"
                    value={editingDoctor.photo_url || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, photo_url: e.target.value })}
                    placeholder="https://example.com/doctor-photo.jpg"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload image to Supabase Storage and paste URL here</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={editingDoctor.bio || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, bio: e.target.value })}
                    placeholder="Brief description of the doctor's background and expertise..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Available Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {allDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const current = editingDoctor.available_days || [];
                        const updated = current.includes(day)
                          ? current.filter((d) => d !== day)
                          : [...current, day];
                        setEditingDoctor({ ...editingDoctor, available_days: updated });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        editingDoctor.available_days?.includes(day)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {commonLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        const current = editingDoctor.languages_spoken || [];
                        const updated = current.includes(lang)
                          ? current.filter((l) => l !== lang)
                          : [...current, lang];
                        setEditingDoctor({ ...editingDoctor, languages_spoken: updated });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        editingDoctor.languages_spoken?.includes(lang)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDoctor(null);
                }}
                className="px-6 py-2.5 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDoctor}
                disabled={saving || !editingDoctor.full_name || !editingDoctor.specialization}
                className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingDoctor.id ? 'Update Doctor' : 'Add Doctor'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}