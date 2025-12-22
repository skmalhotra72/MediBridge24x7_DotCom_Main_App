'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/clinic-website/AdminLayout';

interface Testimonial {
  id: string;
  organization_id: string;
  patient_name: string;
  patient_photo_url: string;
  rating: number;
  review_text: string;
  treatment_type: string;
  review_date: string;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
}

const emptyTestimonial: Partial<Testimonial> = {
  patient_name: '',
  patient_photo_url: '',
  rating: 5,
  review_text: '',
  treatment_type: '',
  review_date: new Date().toISOString().split('T')[0],
  is_featured: false,
  is_approved: true,
};

export default function TestimonialsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const org = params.org as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTestimonials = async (organizationId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (data) setTestimonials(data);
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
      await fetchTestimonials(organization.id);
      setLoading(false);
    }

    fetchData();
  }, [org, router]);

  const handleAddTestimonial = () => {
    setEditingTestimonial({ ...emptyTestimonial });
    setIsModalOpen(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial({ ...testimonial });
    setIsModalOpen(true);
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', testimonialId);

    if (error) {
      setErrorMessage('Failed to delete testimonial');
      return;
    }

    setSuccessMessage('Testimonial deleted successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    await fetchTestimonials(orgId);
  };

  const handleSaveTestimonial = async () => {
    if (!editingTestimonial) return;
    setSaving(true);
    setErrorMessage('');

    const supabase = createClient();

    try {
      if (editingTestimonial.id) {
        // Update existing
        const { error } = await supabase
          .from('testimonials')
          .update({
            patient_name: editingTestimonial.patient_name,
            patient_photo_url: editingTestimonial.patient_photo_url,
            rating: editingTestimonial.rating,
            review_text: editingTestimonial.review_text,
            treatment_type: editingTestimonial.treatment_type,
            review_date: editingTestimonial.review_date,
            is_featured: editingTestimonial.is_featured,
            is_approved: editingTestimonial.is_approved,
          })
          .eq('id', editingTestimonial.id);

        if (error) throw error;
        setSuccessMessage('Testimonial updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('testimonials')
          .insert({
            organization_id: orgId,
            patient_name: editingTestimonial.patient_name,
            patient_photo_url: editingTestimonial.patient_photo_url,
            rating: editingTestimonial.rating,
            review_text: editingTestimonial.review_text,
            treatment_type: editingTestimonial.treatment_type,
            review_date: editingTestimonial.review_date,
            is_featured: editingTestimonial.is_featured,
            is_approved: true,
          });

        if (error) throw error;
        setSuccessMessage('Testimonial added successfully');
      }

      setTimeout(() => setSuccessMessage(''), 3000);
      setIsModalOpen(false);
      setEditingTestimonial(null);
      await fetchTestimonials(orgId);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (testimonial: Testimonial) => {
    const supabase = createClient();
    await supabase
      .from('testimonials')
      .update({ is_featured: !testimonial.is_featured })
      .eq('id', testimonial.id);
    
    await fetchTestimonials(orgId);
  };

  const toggleApproved = async (testimonial: Testimonial) => {
    const supabase = createClient();
    await supabase
      .from('testimonials')
      .update({ is_approved: !testimonial.is_approved })
      .eq('id', testimonial.id);
    
    await fetchTestimonials(orgId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout orgSlug={org} orgName={orgName}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Testimonials</h1>
          <p className="text-gray-500 mt-1">Showcase patient reviews and success stories</p>
        </div>
        <button
          onClick={handleAddTestimonial}
          className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Testimonial
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

      {/* Testimonials List */}
      {testimonials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials yet</h3>
          <p className="text-gray-500 mb-6">Add patient reviews to build trust with new visitors</p>
          <button
            onClick={handleAddTestimonial}
            className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Testimonial
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-xl border ${testimonial.is_approved ? 'border-gray-200' : 'border-amber-200 bg-amber-50/50'} p-6`}
            >
              <div className="flex items-start gap-4">
                {/* Patient Photo */}
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {testimonial.patient_photo_url ? (
                    <img
                      src={testimonial.patient_photo_url}
                      alt={testimonial.patient_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-gray-400">
                      {testimonial.patient_name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{testimonial.patient_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {renderStars(testimonial.rating)}
                        {testimonial.treatment_type && (
                          <span className="text-sm text-gray-500">{testimonial.treatment_type}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {testimonial.is_featured && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          Featured
                        </span>
                      )}
                      {!testimonial.is_approved && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">"{testimonial.review_text}"</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {new Date(testimonial.review_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFeatured(testimonial)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          testimonial.is_featured
                            ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {testimonial.is_featured ? '★ Featured' : '☆ Feature'}
                      </button>
                      <button
                        onClick={() => toggleApproved(testimonial)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          testimonial.is_approved
                            ? 'text-green-600 bg-green-50 hover:bg-green-100'
                            : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                        }`}
                      >
                        {testimonial.is_approved ? '✓ Approved' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleEditTestimonial(testimonial)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && editingTestimonial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTestimonial.id ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTestimonial(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                <input
                  type="text"
                  value={editingTestimonial.patient_name || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, patient_name: e.target.value })}
                  placeholder="Rahul Sharma"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                {renderStars(editingTestimonial.rating || 5, true, (rating) => 
                  setEditingTestimonial({ ...editingTestimonial, rating })
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review *</label>
                <textarea
                  value={editingTestimonial.review_text || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, review_text: e.target.value })}
                  placeholder="Share the patient's experience..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Type</label>
                <input
                  type="text"
                  value={editingTestimonial.treatment_type || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, treatment_type: e.target.value })}
                  placeholder="e.g., General Checkup, Pediatric Care"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Date</label>
                <input
                  type="date"
                  value={editingTestimonial.review_date || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, review_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Photo URL (Optional)</label>
                <input
                  type="url"
                  value={editingTestimonial.patient_photo_url || ''}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, patient_photo_url: e.target.value })}
                  placeholder="https://example.com/patient-photo.jpg"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTestimonial.is_featured || false}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Featured testimonial</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTestimonial(null);
                }}
                className="px-6 py-2.5 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTestimonial}
                disabled={saving || !editingTestimonial.patient_name || !editingTestimonial.review_text}
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
                    {editingTestimonial.id ? 'Update' : 'Add Testimonial'}
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