import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Input, FileUpload } from '../index';
import { useAuthStore } from '../../store/authStore';
import type { Organization, OrganizationSettings, OrganizationStatus } from '../../lib/types';

interface OrganizationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrganizationFormData) => Promise<void>;
  organization?: Organization;
  settings?: OrganizationSettings;
  mode: 'create' | 'edit';
}

export interface OrganizationFormData {
  name: string;
  subdomain: string;
  logo_url?: string;
  status: OrganizationStatus;
  primary_color?: string;
  secondary_color?: string;
  ai_enabled: boolean;
  escalation_enabled: boolean;
}

export const OrganizationForm = ({
  isOpen,
  onClose,
  onSubmit,
  organization,
  settings,
  mode,
}: OrganizationFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    subdomain: '',
    logo_url: '',
    status: 'active',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    ai_enabled: true,
    escalation_enabled: true,
  });

  useEffect(() => {
    if (mode === 'edit' && organization) {
      setFormData({
        name: organization.name,
        subdomain: organization.subdomain,
        logo_url: organization.logo_url || '',
        status: organization.status,
        primary_color: settings?.primary_color || '#3B82F6',
        secondary_color: settings?.secondary_color || '#10B981',
        ai_enabled: settings?.ai_enabled ?? true,
        escalation_enabled: settings?.escalation_enabled ?? true,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        subdomain: '',
        logo_url: '',
        status: 'active',
        primary_color: '#3B82F6',
        secondary_color: '#10B981',
        ai_enabled: true,
        escalation_enabled: true,
      });
    }
  }, [mode, organization, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof OrganizationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'create' ? 'Add New Organization' : 'Edit Organization'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Organization Details
            </h3>

            <Input
              label="Organization Name"
              placeholder="City General Hospital"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Subdomain"
              placeholder="city-general"
              value={formData.subdomain}
              onChange={(e) => handleChange('subdomain', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              required
              disabled={isLoading}
              helperText="Used for organization identification (lowercase, hyphens allowed)"
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Organization Logo
              </label>
              {formData.logo_url && (
                <div className="mb-4 p-4 bg-slate-900 border border-slate-700 rounded-lg">
                  <img
                    src={formData.logo_url}
                    alt="Current logo"
                    className="h-16 w-auto object-contain"
                  />
                  <p className="text-xs text-slate-500 mt-2">Current logo</p>
                </div>
              )}
              {mode === 'edit' && organization && (
                <FileUpload
                  bucket="org-logos"
                  folder={organization.id}
                  onUploadComplete={(url) => handleChange('logo_url', url)}
                  acceptedFileTypes="image/*"
                  maxSizeMB={2}
                  label="Upload New Logo"
                  description="PNG, JPG, or SVG"
                />
              )}
              {mode === 'create' && (
                <Input
                  label="Logo URL (optional)"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  disabled={isLoading}
                  helperText="Upload logo after creating organization"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Organization Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => handleChange('primary_color', e.target.value)}
                disabled={isLoading}
              />

              <Input
                label="Secondary Color"
                type="color"
                value={formData.secondary_color}
                onChange={(e) => handleChange('secondary_color', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ai_enabled}
                  onChange={(e) => handleChange('ai_enabled', e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-slate-900 border-slate-700 rounded focus:ring-primary-500 focus:ring-offset-slate-800"
                  disabled={isLoading}
                />
                <div>
                  <span className="text-sm font-medium text-white">AI Features Enabled</span>
                  <p className="text-xs text-slate-400">Enable AI-powered diagnostics and automation</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.escalation_enabled}
                  onChange={(e) => handleChange('escalation_enabled', e.target.checked)}
                  className="w-5 h-5 text-primary-600 bg-slate-900 border-slate-700 rounded focus:ring-primary-500 focus:ring-offset-slate-800"
                  disabled={isLoading}
                />
                <div>
                  <span className="text-sm font-medium text-white">Escalation System Enabled</span>
                  <p className="text-xs text-slate-400">Allow staff to escalate complex cases</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
              {mode === 'create' ? 'Create Organization' : 'Update Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
