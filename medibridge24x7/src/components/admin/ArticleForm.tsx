import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '../index';
import { supabase } from '../../lib/supabaseClient';
import type { Organization } from '../../lib/types';

interface Article {
  id: string;
  organization_id?: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  is_global: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface ArticleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ArticleFormData) => Promise<void>;
  article?: Article;
  mode: 'create' | 'edit';
}

export interface ArticleFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_global: boolean;
  organization_id?: string;
}

export const ArticleForm = ({ isOpen, onClose, onSubmit, article, mode }: ArticleFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    category: '',
    tags: [],
    is_global: false,
    organization_id: undefined,
  });
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'edit' && article) {
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category || '',
        tags: article.tags || [],
        is_global: article.is_global,
        organization_id: article.organization_id,
      });
      setTagsInput((article.tags || []).join(', '));
    } else if (mode === 'create') {
      setFormData({
        title: '',
        content: '',
        category: '',
        tags: [],
        is_global: false,
        organization_id: undefined,
      });
      setTagsInput('');
    }
  }, [mode, article]);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await onSubmit({
        ...formData,
        tags,
        organization_id: formData.is_global ? undefined : formData.organization_id,
      });
      onClose();
    } catch (error) {
      console.error('Form submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ArticleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'create' ? 'Add New Article' : 'Edit Article'}
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
            <Input
              label="Article Title"
              placeholder="How to manage diabetes effectively"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              disabled={isLoading}
              className="bg-slate"
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Enter the full article content..."
                required
                disabled={isLoading}
                rows={12}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Category"
                placeholder="General Health, Nutrition, etc."
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                disabled={isLoading}
                className="bg-slate"
              />

              <Input
                label="Tags (comma-separated)"
                placeholder="diabetes, diet, exercise"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={isLoading}
                className="bg-slate"
                helperText="Separate tags with commas"
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Visibility Settings
            </h3>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_global}
                onChange={(e) => {
                  handleChange('is_global', e.target.checked);
                  if (e.target.checked) {
                    handleChange('organization_id', undefined);
                  }
                }}
                className="w-5 h-5 text-primary-600 bg-slate-900 border-slate-700 rounded focus:ring-primary-500 focus:ring-offset-slate-800"
                disabled={isLoading}
              />
              <div>
                <span className="text-sm font-medium text-white">Global Article</span>
                <p className="text-xs text-slate-400">
                  Make this article visible to all organizations
                </p>
              </div>
            </label>

            {!formData.is_global && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Organization
                </label>
                <select
                  value={formData.organization_id || ''}
                  onChange={(e) =>
                    handleChange('organization_id', e.target.value || undefined)
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isLoading}
                  required={!formData.is_global}
                >
                  <option value="">Select an organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  This article will only be visible to the selected organization
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
              {mode === 'create' ? 'Create Article' : 'Update Article'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
