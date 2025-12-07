import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { Plus, Edit, Trash2, FlaskConical, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LabTest {
  id: string;
  name: string;
  code?: string;
  description?: string;
  default_price?: number;
  is_active: boolean;
  organization_id?: string;
}

export const LabTests = () => {
  const { organization } = useAuthStore();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    default_price: 0,
    is_active: true,
  });

  useEffect(() => {
    if (organization?.id) {
      loadTests();
    }
  }, [organization?.id]);

  const loadTests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${organization!.id}`)
        .order('name');

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      console.error('Error loading tests:', error);
      toast.error('Failed to load lab tests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Test name is required');
      return;
    }

    try {
      const testData = {
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        description: formData.description.trim() || null,
        default_price: formData.default_price || 0,
        is_active: formData.is_active,
        organization_id: organization!.id,
      };

      if (editingTest) {
        const { error } = await supabase
          .from('lab_tests')
          .update(testData)
          .eq('id', editingTest.id);

        if (error) throw error;
        toast.success('Lab test updated successfully');
      } else {
        const { error } = await supabase.from('lab_tests').insert([testData]);

        if (error) throw error;
        toast.success('Lab test created successfully');
      }

      setShowForm(false);
      setEditingTest(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        default_price: 0,
        is_active: true,
      });
      loadTests();
    } catch (error: any) {
      console.error('Error saving test:', error);
      toast.error(error.message || 'Failed to save lab test');
    }
  };

  const handleEdit = (test: LabTest) => {
    if (test.organization_id === null) {
      toast.error('Cannot edit global lab tests');
      return;
    }

    setEditingTest(test);
    setFormData({
      name: test.name,
      code: test.code || '',
      description: test.description || '',
      default_price: test.default_price || 0,
      is_active: test.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (test: LabTest) => {
    if (test.organization_id === null) {
      toast.error('Cannot delete global lab tests');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${test.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('lab_tests').delete().eq('id', test.id);

      if (error) throw error;
      toast.success('Lab test deleted successfully');
      loadTests();
    } catch (error: any) {
      console.error('Error deleting test:', error);
      toast.error(error.message || 'Failed to delete lab test');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTest(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      default_price: 0,
      is_active: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading lab tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lab Tests</h1>
          <p className="text-slate-400">Manage available laboratory tests for your organization</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Lab Test
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingTest ? 'Edit Lab Test' : 'New Lab Test'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Test Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Complete Blood Count"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Test Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CBC"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Enter test description..."
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Default Price
                </label>
                <input
                  type="number"
                  value={formData.default_price}
                  onChange={(e) =>
                    setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.value === 'active' })
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTest ? 'Update Test' : 'Create Test'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <FlaskConical className="w-5 h-5 text-purple-400" />
                      <span className="text-sm font-medium text-white">{test.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-300">
                      {test.code || <span className="text-slate-500">-</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-300">
                      {test.description ? (
                        test.description.length > 60 ? (
                          <span title={test.description}>
                            {test.description.substring(0, 60)}...
                          </span>
                        ) : (
                          test.description
                        )
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-300">
                      {test.default_price ? `$${test.default_price.toFixed(2)}` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${
                        test.is_active
                          ? 'bg-green-900 text-green-300 border-green-700'
                          : 'bg-slate-700 text-slate-400 border-slate-600'
                      }`}
                    >
                      {test.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${
                        test.organization_id === null
                          ? 'bg-blue-900 text-blue-300 border-blue-700'
                          : 'bg-amber-900 text-amber-300 border-amber-700'
                      }`}
                    >
                      {test.organization_id === null ? 'Global' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      {test.organization_id !== null && (
                        <>
                          <button
                            onClick={() => handleEdit(test)}
                            className="p-2 text-blue-300 bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(test)}
                            className="p-2 text-red-300 bg-red-900 hover:bg-red-800 border border-red-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {test.organization_id === null && (
                        <span className="text-xs text-slate-500 italic">Global test</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tests.length === 0 && (
          <div className="text-center py-12">
            <FlaskConical className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No lab tests available</p>
            <p className="text-sm text-slate-500">Add your first lab test to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
