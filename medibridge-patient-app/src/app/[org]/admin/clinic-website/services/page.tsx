'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/clinic-website/AdminLayout';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  price?: number;
  duration?: string;
}

const defaultIcons = [
  { name: 'stethoscope', emoji: '🩺', label: 'Stethoscope' },
  { name: 'heart', emoji: '❤️', label: 'Heart' },
  { name: 'baby', emoji: '👶', label: 'Baby' },
  { name: 'tooth', emoji: '🦷', label: 'Tooth' },
  { name: 'eye', emoji: '👁️', label: 'Eye' },
  { name: 'bone', emoji: '🦴', label: 'Bone' },
  { name: 'brain', emoji: '🧠', label: 'Brain' },
  { name: 'syringe', emoji: '💉', label: 'Syringe' },
  { name: 'pill', emoji: '💊', label: 'Medicine' },
  { name: 'bandage', emoji: '🩹', label: 'Bandage' },
  { name: 'hospital', emoji: '🏥', label: 'Hospital' },
  { name: 'ambulance', emoji: '🚑', label: 'Emergency' },
];

const emptyService: Partial<Service> = {
  name: '',
  description: '',
  icon: '🩺',
  price: undefined,
  duration: '',
};

export default function ServicesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const org = params.org as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

      // Get clinic profile with services
      const { data: profile } = await supabase
        .from('clinic_profiles')
        .select('id, services')
        .eq('organization_id', organization.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
        setServices(profile.services || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [org, router]);

  const saveServices = async (updatedServices: Service[]) => {
    setSaving(true);
    const supabase = createClient();

    try {
      if (profileId) {
        const { error } = await supabase
          .from('clinic_profiles')
          .update({ services: updatedServices, updated_at: new Date().toISOString() })
          .eq('id', profileId);

        if (error) throw error;
      } else {
        // Create new profile with services
        const { data, error } = await supabase
          .from('clinic_profiles')
          .insert({ organization_id: orgId, services: updatedServices })
          .select('id')
          .single();

        if (error) throw error;
        if (data) setProfileId(data.id);
      }

      setServices(updatedServices);
      setSuccessMessage('Services saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save services');
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = () => {
    setEditingService({ ...emptyService, id: crypto.randomUUID() });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service, index: number) => {
    setEditingService({ ...service });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleDeleteService = async (index: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const updatedServices = services.filter((_, i) => i !== index);
    await saveServices(updatedServices);
  };

  const handleSaveService = async () => {
    if (!editingService || !editingService.name) return;

    let updatedServices: Service[];
    
    if (editingIndex !== null) {
      // Update existing
      updatedServices = services.map((s, i) => 
        i === editingIndex ? (editingService as Service) : s
      );
    } else {
      // Add new
      updatedServices = [...services, editingService as Service];
    }

    await saveServices(updatedServices);
    setIsModalOpen(false);
    setEditingService(null);
    setEditingIndex(null);
  };

  const moveService = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= services.length) return;

    const updatedServices = [...services];
    [updatedServices[index], updatedServices[newIndex]] = [updatedServices[newIndex], updatedServices[index]];
    await saveServices(updatedServices);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout orgSlug={org} orgName={orgName}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Services</h1>
          <p className="text-gray-500 mt-1">Manage the services your clinic offers</p>
        </div>
        <button
          onClick={handleAddService}
          className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Service
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

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services added yet</h3>
          <p className="text-gray-500 mb-6">Add the services your clinic offers to display them on your website</p>
          <button
            onClick={handleAddService}
            className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service, index) => (
            <div
              key={service.id || index}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
            >
              {/* Reorder Buttons */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveService(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveService(index, 'down')}
                  disabled={index === services.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                {service.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500 truncate">{service.description}</p>
                {(service.price || service.duration) && (
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    {service.price && <span>₹{service.price}</span>}
                    {service.duration && <span>{service.duration}</span>}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditService(service, index)}
                  className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteService(index)}
                  className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingIndex !== null ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingService(null);
                  setEditingIndex(null);
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
                <input
                  type="text"
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="e.g., General Consultation"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Brief description of this service..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {defaultIcons.map((icon) => (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => setEditingService({ ...editingService, icon: icon.emoji })}
                      className={`p-3 rounded-lg text-2xl transition-all ${
                        editingService.icon === icon.emoji
                          ? 'bg-purple-100 ring-2 ring-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      title={icon.label}
                    >
                      {icon.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={editingService.price || ''}
                    onChange={(e) => setEditingService({ ...editingService, price: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Optional"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={editingService.duration || ''}
                    onChange={(e) => setEditingService({ ...editingService, duration: e.target.value })}
                    placeholder="e.g., 30 mins"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingService(null);
                  setEditingIndex(null);
                }}
                className="px-6 py-2.5 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                disabled={saving || !editingService.name}
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
                    {editingIndex !== null ? 'Update Service' : 'Add Service'}
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