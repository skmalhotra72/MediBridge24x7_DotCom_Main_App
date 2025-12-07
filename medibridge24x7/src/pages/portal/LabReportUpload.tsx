import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { FileUpload } from '../../components';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface LabOrder {
  id: string;
  patient_id: string;
  test_names: string;
  status: string;
  special_instructions?: string;
  patient_name?: string;
}

export const LabReportUpload = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [labOrder, setLabOrder] = useState<LabOrder | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [uploadedPath, setUploadedPath] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (id && organization?.id) {
      loadLabOrder();
    }
  }, [id, organization?.id]);

  const loadLabOrder = async () => {
    try {
      setIsLoading(true);

      const { data: orderData, error: orderError } = await supabase
        .from('lab_orders')
        .select('*')
        .eq('id', id!)
        .eq('organization_id', organization!.id)
        .maybeSingle();

      if (orderError) throw orderError;

      if (!orderData) {
        toast.error('Lab order not found');
        navigate('/portal/lab-orders');
        return;
      }

      const { data: testsData } = await supabase
        .from('lab_order_tests')
        .select('lab_tests(name)')
        .eq('lab_order_id', id!);

      const testNames =
        testsData
          ?.map((t: any) => t.lab_tests?.name)
          .filter(Boolean)
          .join(', ') || 'No tests';

      const { data: patientData } = await supabase
        .from('patients')
        .select('full_name')
        .eq('id', orderData.patient_id)
        .maybeSingle();

      setLabOrder({
        ...orderData,
        test_names: testNames,
        patient_name: patientData?.full_name || 'Unknown Patient',
      });
    } catch (error: any) {
      console.error('Error loading lab order:', error);
      toast.error('Failed to load lab order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (url: string, filePath: string) => {
    setUploadedUrl(url);
    setUploadedPath(filePath);
  };

  const handleSaveReport = async () => {
    if (!uploadedUrl || !uploadedPath) {
      toast.error('Please upload a file first');
      return;
    }

    try {
      setIsSaving(true);

      const { data: currentStaff } = await supabase
        .from('org_staff')
        .select('id')
        .eq('organization_id', organization!.id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!currentStaff) {
        throw new Error('Staff information not found');
      }

      const { error: reportError } = await supabase.from('lab_reports').insert([
        {
          lab_order_id: id!,
          file_path: uploadedPath,
          report_file_url: uploadedUrl,
          uploaded_by: currentStaff.id,
          notes: notes.trim() || null,
        },
      ]);

      if (reportError) throw reportError;

      const { error: updateError } = await supabase
        .from('lab_orders')
        .update({ status: 'completed' })
        .eq('id', id!);

      if (updateError) throw updateError;

      setUploadSuccess(true);
      toast.success('Lab report saved successfully');
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error(error.message || 'Failed to save lab report');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!labOrder) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Lab order not found</p>
      </div>
    );
  }

  if (uploadSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Report Uploaded Successfully</h2>
          <p className="text-slate-400 mb-6">
            The lab report has been uploaded and the order status has been updated to completed.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => navigate('/portal/lab-orders')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Back to Lab Orders
            </button>
            <button
              onClick={() => navigate(`/portal/patients/${labOrder.patient_id}`)}
              className="px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors"
            >
              View Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/portal/lab-orders')}
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Lab Orders
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Upload Lab Report</h2>
          <p className="text-sm text-slate-400 mt-1">Upload the lab test results for this order</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Lab Order Details
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="text-xs text-slate-500">Patient</div>
                <div className="text-sm font-medium text-white text-right">
                  {labOrder.patient_name}
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div className="text-xs text-slate-500">Tests Ordered</div>
                <div className="text-sm font-medium text-white text-right max-w-md">
                  {labOrder.test_names}
                </div>
              </div>
              {labOrder.special_instructions && (
                <div className="pt-2 border-t border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">Special Instructions</div>
                  <div className="text-sm text-slate-300">{labOrder.special_instructions}</div>
                </div>
              )}
            </div>
          </div>

          <FileUpload
            bucket="lab-reports"
            folder={organization!.id}
            onUploadComplete={handleUploadComplete}
            acceptedFileTypes="image/*,application/pdf"
            maxSizeMB={10}
            label="Upload Report File *"
            description="PDF or Image files"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any notes about the lab report..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => navigate('/portal/lab-orders')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReport}
              disabled={!uploadedUrl || isSaving}
              className="px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
