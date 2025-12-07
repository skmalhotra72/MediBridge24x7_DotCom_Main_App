import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components';
import { ArticleForm, ArticleFormData } from '../../components/admin/ArticleForm';
import { DeleteConfirmationDialog } from '../../components/admin/DeleteConfirmationDialog';
import { Plus, Edit, Trash2, Search, Globe, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
  organization?: {
    name: string;
  };
}

export const KnowledgeBase = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchQuery, categoryFilter]);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const articlesWithOrgs = await Promise.all(
        (data || []).map(async (article) => {
          if (article.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', article.organization_id)
              .maybeSingle();

            return { ...article, organization: org || undefined };
          }
          return article;
        })
      );

      setArticles(articlesWithOrgs);

      const uniqueCategories = Array.from(
        new Set(
          articlesWithOrgs
            .map((a) => a.category)
            .filter((c): c is string => Boolean(c))
        )
      );
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('Error loading articles:', error);
      toast.error(error.message || 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((article) => article.category === categoryFilter);
    }

    setFilteredArticles(filtered);
  };

  const handleCreate = async (formData: ArticleFormData) => {
    try {
      setIsSubmitting(true);

      const { data: authData } = await supabase.auth.getUser();

      const { error } = await supabase.from('knowledge_articles').insert({
        title: formData.title,
        content: formData.content,
        category: formData.category || null,
        tags: formData.tags,
        is_global: formData.is_global,
        organization_id: formData.organization_id || null,
        created_by: authData.user?.id,
      });

      if (error) throw error;

      toast.success('Article created successfully');
      loadArticles();
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Error creating article:', error);
      toast.error(error.message || 'Failed to create article');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData: ArticleFormData) => {
    if (!selectedArticle) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('knowledge_articles')
        .update({
          title: formData.title,
          content: formData.content,
          category: formData.category || null,
          tags: formData.tags,
          is_global: formData.is_global,
          organization_id: formData.organization_id || null,
        })
        .eq('id', selectedArticle.id);

      if (error) throw error;

      toast.success('Article updated successfully');
      loadArticles();
      setIsFormOpen(false);
      setSelectedArticle(null);
    } catch (error: any) {
      console.error('Error updating article:', error);
      toast.error(error.message || 'Failed to update article');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', selectedArticle.id);

      if (error) throw error;

      toast.success('Article deleted successfully');
      loadArticles();
      setIsDeleteDialogOpen(false);
      setSelectedArticle(null);
    } catch (error: any) {
      console.error('Error deleting article:', error);
      toast.error(error.message || 'Failed to delete article');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateForm = () => {
    setSelectedArticle(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const openEditForm = (article: Article) => {
    setSelectedArticle(article);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const openDeleteDialog = (article: Article) => {
    setSelectedArticle(article);
    setIsDeleteDialogOpen(true);
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Knowledge Base</h1>
          <p className="text-slate-400">
            Manage healthcare articles and information resources
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Article
        </Button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading articles...</p>
          </div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-slate-400 mb-4">
            {searchQuery || categoryFilter ? 'No articles match your filters' : 'No articles found'}
          </p>
          {!searchQuery && !categoryFilter && (
            <Button onClick={openCreateForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Article
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {article.is_global ? (
                      <Globe className="w-4 h-4 text-primary-400" />
                    ) : (
                      <Building2 className="w-4 h-4 text-secondary-400" />
                    )}
                    <span className="text-xs text-slate-400">
                      {article.is_global
                        ? 'Global Article'
                        : article.organization?.name || 'Organization Specific'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{article.title}</h3>
                  {article.category && (
                    <span className="inline-block px-2 py-1 bg-primary-900 text-primary-300 text-xs font-medium rounded border border-primary-700 mb-2">
                      {article.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => openEditForm(article)}
                    className="p-2 text-slate-400 hover:text-primary-400 hover:bg-slate-700 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(article)}
                    className="p-2 text-slate-400 hover:text-accent-400 hover:bg-slate-700 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-4">{truncateContent(article.content)}</p>

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-xs text-slate-500">
                {new Date(article.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ArticleForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedArticle(null);
        }}
        onSubmit={formMode === 'create' ? handleCreate : handleUpdate}
        article={selectedArticle || undefined}
        mode={formMode}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedArticle(null);
        }}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${selectedArticle?.title}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};
