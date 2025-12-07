import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components';
import { OrganizationForm, OrganizationFormData } from '../../components/admin/OrganizationForm';
import { DeleteConfirmationDialog } from '../../components/admin/DeleteConfirmationDialog';
import { Plus, Edit, Settings, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Organization, OrganizationSettings } from '../../lib/types';

interface OrganizationWithSettings extends Organization {
  settings?: OrganizationSettings;
}

export const Organizations = () => {
  const [organizations, setOrganizations] = useState<OrganizationWithSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedOrg, setSelectedOrg] = useState<OrganizationWithSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      const orgsWithSettings = await Promise.all(
        (orgsData || []).map(async (org) => {
          const { data: settings } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('organization_id', org.id)
            .maybeSingle();

          return {
            ...org,
            settings: settings || undefined,
          };
        })
      );

      setOrganizations(orgsWithSettings);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      toast.error(error.message || 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData: OrganizationFormData) => {
    try {
      setIsSubmitting(true);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          subdomain: formData.subdomain,
          logo_url: formData.logo_url || null,
          status: formData.status,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: settingsError } = await supabase
        .from('organization_settings')
        .insert({
          organization_id: orgData.id,
          primary_color: formData.primary_color || '#3B82F6',
          secondary_color: formData.secondary_color || '#10B981',
          logo_url: formData.logo_url || null,
          ai_enabled: formData.ai_enabled,
          escalation_enabled: formData.escalation_enabled,
        });

      if (settingsError) throw settingsError;

      toast.success('Organization created successfully');
      loadOrganizations();
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData: OrganizationFormData) => {
    if (!selectedOrg) return;

    try {
      setIsSubmitting(true);

      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          subdomain: formData.subdomain,
          logo_url: formData.logo_url || null,
          status: formData.status,
        })
        .eq('id', selectedOrg.id);

      if (orgError) throw orgError;

      if (selectedOrg.settings) {
        const { error: settingsError } = await supabase
          .from('organization_settings')
          .update({
            primary_color: formData.primary_color || '#3B82F6',
            secondary_color: formData.secondary_color || '#10B981',
            logo_url: formData.logo_url || null,
            ai_enabled: formData.ai_enabled,
            escalation_enabled: formData.escalation_enabled,
          })
          .eq('id', selectedOrg.settings.id);

        if (settingsError) throw settingsError;
      } else {
        const { error: settingsError } = await supabase
          .from('organization_settings')
          .insert({
            organization_id: selectedOrg.id,
            primary_color: formData.primary_color || '#3B82F6',
            secondary_color: formData.secondary_color || '#10B981',
            logo_url: formData.logo_url || null,
            ai_enabled: formData.ai_enabled,
            escalation_enabled: formData.escalation_enabled,
          });

        if (settingsError) throw settingsError;
      }

      toast.success('Organization updated successfully');
      loadOrganizations();
      setIsFormOpen(false);
      setSelectedOrg(null);
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast.error(error.message || 'Failed to update organization');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('organizations')
        .update({ status: 'inactive' })
        .eq('id', selectedOrg.id);

      if (error) throw error;

      toast.success('Organization deactivated successfully');
      loadOrganizations();
      setIsDeleteDialogOpen(false);
      setSelectedOrg(null);
    } catch (error: any) {
      console.error('Error deactivating organization:', error);
      toast.error(error.message || 'Failed to deactivate organization');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateForm = () => {
    setSelectedOrg(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const openEditForm = (org: OrganizationWithSettings) => {
    setSelectedOrg(org);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const openDeleteDialog = (org: OrganizationWithSettings) => {
    setSelectedOrg(org);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-secondary-900 text-secondary-300 border-secondary-700',
      inactive: 'bg-slate-700 text-slate-300 border-slate-600',
      suspended: 'bg-accent-900 text-accent-300 border-accent-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.inactive
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Organizations</h1>
          <p className="text-slate-400">Manage healthcare organizations in the system</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading organizations...</p>
          </div>
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-slate-400 mb-4">No organizations found</p>
          <Button onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Organization
          </Button>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Subdomain
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {org.logo_url ? (
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {org.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{org.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{org.subdomain}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">
                        {new Date(org.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditForm(org)}
                          className="p-2 text-slate-400 hover:text-primary-400 hover:bg-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditForm(org)}
                          className="p-2 text-slate-400 hover:text-secondary-400 hover:bg-slate-700 rounded transition-colors"
                          title="View Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(org)}
                          className="p-2 text-slate-400 hover:text-accent-400 hover:bg-slate-700 rounded transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OrganizationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedOrg(null);
        }}
        onSubmit={formMode === 'create' ? handleCreate : handleUpdate}
        organization={selectedOrg || undefined}
        settings={selectedOrg?.settings}
        mode={formMode}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedOrg(null);
        }}
        onConfirm={handleDelete}
        title="Deactivate Organization"
        message={`Are you sure you want to deactivate "${selectedOrg?.name}"? This will set the status to inactive and prevent users from accessing this organization.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
