// CORRECTED VERSION - Upload Page
// File: src/app/[org]/upload/page.tsx
// All webhook URLs fixed, no spaces, proper environment variable handling

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // FIXED: No spaces, proper fallback
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.nhcare.in/webhook/medibridge-chat-v6-test';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a PDF or image file (JPG, PNG)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Please log in to upload files');
      }

      // Get user profile/patient data
      const { data: profile, error: profileError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Patient profile not found');
      }

      setUploadProgress(20);

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `prescriptions/${profile.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescription-files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(40);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prescription-files')
        .getPublicUrl(filePath);

      setUploadProgress(60);

      // Prepare webhook payload
      const webhookPayload = {
        prescription_id: crypto.randomUUID(),
        file_url: publicUrl,
        file_type: selectedFile.type,
        user_id: user.id,
        user_name: profile.full_name || 'Patient',
        user_email: user.email,
        patient_id: profile.id,
        organization: profile.organization_id,
        organization_id: profile.organization_id,
        chief_complaint: chiefComplaint || 'General prescription analysis',
        channel: 'web',
        document_type: 'prescription'
      };

      console.log('Calling webhook:', webhookUrl);
      console.log('Payload:', webhookPayload);

      // Call n8n webhook - FIXED: No spaces in URL
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      setUploadProgress(80);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Webhook error:', errorText);
        throw new Error(`Webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
      }

      const result = await webhookResponse.json();
      console.log('Webhook response:', result);

      setUploadProgress(100);

      // Show success message
      alert('Prescription uploaded successfully! Analysis in progress...');

      // Redirect to prescriptions page or dashboard
      router.push(`/${profile.organization_id}/prescriptions`);

    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Upload Prescription</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Prescription File
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Chief Complaint Section */}
        <div>
          <label className="block text-sm font-medium mb-2">
            What would you like to know? (Optional)
          </label>
          <textarea
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            disabled={isUploading}
            placeholder="e.g., planning to visit my doctor today could you check my history and share what should I tell the doctor about my progress and could you find and share clinic address as well"
            className="w-full px-3 py-2 border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:opacity-50"
            rows={4}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md
            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
            font-medium transition-colors"
        >
          {isUploading ? 'Analyzing...' : 'Analyze Prescription'}
        </button>

        {/* Help Text */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Supported formats: PDF, JPG, PNG</p>
          <p>• Maximum file size: 10MB</p>
          <p>• AI will analyze your prescription and provide insights</p>
        </div>
      </div>

      {/* Debug Info (Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Webhook URL: {webhookUrl}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      )}
    </div>
  );
}