'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Icons
const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MicIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const TextIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

export default function UploadPage({ params }: { params: Promise<{ org: string }> }) {
  const router = useRouter();
  
  // State
  const [org, setOrg] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'camera' | 'voice' | null>(null);
  
  // Chief Concern State
  const [chiefConcern, setChiefConcern] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load org param - FIXED: using useEffect instead of useState
  useEffect(() => {
    params.then(p => setOrg(p.org));
  }, [params]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  // Handle Upload to Supabase + Call n8n Webhook
  const handleUpload = async () => {
    // ⭐ DEBUG MARKER - Remove after testing
    console.log('🚀🚀🚀 NEW UPLOAD CODE V3 RUNNING 🚀🚀🚀');
    console.log('🎯 Chief Concern State Value:', chiefConcern);
    
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get organization ID
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('subdomain', org)
        .single();
      
      if (!orgData) throw new Error('Organization not found');

      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

      // ⭐ Capture chief concern BEFORE the insert
      const patientChiefConcern = chiefConcern.trim();
      console.log('💾 Saving chief concern to prescription:', patientChiefConcern || 'None provided');

      // Create prescription record WITH chief concern
      const { data: prescription, error: insertError } = await supabase
        .from('prescriptions')
        .insert({
          organization_id: orgData.id,
          user_id: user.id,
          file_path: fileName,
          file_url: publicUrl,
          file_type: selectedFile.type,
          status: 'pending',
          upload_source: 'web',
          chief_concern: patientChiefConcern || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Use prescription ID as chat session ID
      const chatSessionId = prescription.id;

      // ⭐ Query = ALWAYS the standard analysis instruction (FIXED - not same as chief concern)
      const queryText = 'Please analyze this prescription and explain all medicines, dosages, precautions, and instructions clearly.';

      // Debug logs
      console.log('📝 [Upload] Chief Concern (patient typed):', patientChiefConcern || 'None');
      console.log('📝 [Upload] Query (analysis instruction):', queryText);

// n8n webhook URL
const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
  'https://n8n.nhcare.in/webhook/28465002-1451-4336-8fc7-eb333dec1ef3';
      // Build webhook payload with ALL required fields
      const webhookPayload = {
        body: {
          // Prescription & File Info
          prescription_id: prescription.id,
          file_url: publicUrl,
          file_type: selectedFile.type.includes('pdf') ? 'pdf' : 'image',
          
          // User Info
          user_id: user.id,
          user_name: user.user_metadata?.full_name || 'Patient',
          user_email: user.email,
          phone: user.user_metadata?.phone || '',
          
          // Organization Info
          organization_id: orgData.id,
          clinic_name: orgData.name || 'MediBridge',
          
          // Session Info
          chat_session_id: chatSessionId,
          
          // ⭐ CHIEF CONCERN - Both fields for compatibility
          query: queryText,
          chief_concern: patientChiefConcern || null,
          
          // Channel Info
          channel: 'web',
          language: 'auto-detect'
        }
      };

      // Debug log the full payload
      console.log('📦 [Upload] Full webhook payload:', JSON.stringify(webhookPayload, null, 2));

      // Send to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      console.log('✅ [Upload] Webhook response status:', response.status);

      // Redirect to chat page
      router.push(`/${org}/chat?prescription_id=${prescription.id}&session=${chatSessionId}`);

    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link 
            href={`/${org}`}
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Upload Prescription</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Upload Methods */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Upload Method</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Upload File */}
            <button
              onClick={() => {
                setUploadMethod('file');
                fileInputRef.current?.click();
              }}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                uploadMethod === 'file' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-dashed border-gray-300 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className={`${uploadMethod === 'file' ? 'text-blue-600' : 'text-orange-500'}`}>
                <UploadIcon />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">Upload File</span>
              <span className="text-xs text-gray-500">PDF, JPG, PNG</span>
            </button>

            {/* Take Photo */}
            <button
              onClick={() => {
                setUploadMethod('camera');
                cameraInputRef.current?.click();
              }}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                uploadMethod === 'camera' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-dashed border-gray-300 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className={`${uploadMethod === 'camera' ? 'text-blue-600' : 'text-gray-500'}`}>
                <CameraIcon />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">Take Photo</span>
              <span className="text-xs text-gray-500">Use camera</span>
            </button>

            {/* Voice Note */}
            <button
              onClick={() => setUploadMethod('voice')}
              disabled
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl opacity-60 cursor-not-allowed"
            >
              <div className="text-gray-400">
                <MicIcon />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-500">Voice Note</span>
              <span className="text-xs text-gray-400">Coming soon</span>
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File Preview */}
          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setUploadMethod(null);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Image preview */}
              {previewUrl && (
                <div className="mt-3">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-48 rounded-lg mx-auto"
                  />
                </div>
              )}
            </div>
          )}

          {/* No file selected placeholder */}
          {!selectedFile && (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm">No file selected</p>
              <p className="text-xs mt-1">Click "Upload File" above to get started</p>
            </div>
          )}
        </div>

        {/* CHIEF CONCERN / QUESTION TEXT BOX */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-3">
            <div className="text-blue-600 mr-3">
              <TextIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Share your chief concern or question
              </h2>
              <p className="text-sm text-gray-500">
                Help us understand what you need help with (optional)
              </p>
            </div>
          </div>
          
          <textarea
            value={chiefConcern}
            onChange={(e) => {
              setChiefConcern(e.target.value);
              // Debug: Log when user types
              console.log('✏️ Chief concern updated:', e.target.value);
            }}
            placeholder="E.g., I have a headache and fever for the past 3 days. What do these medicines do? Are there any side effects I should watch for?"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
            rows={4}
            maxLength={1000}
          />
          
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-400">
              {chiefConcern.length}/1000 characters
            </p>
            {chiefConcern && (
              <button
                onClick={() => setChiefConcern('')}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full py-4 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading & Analyzing...
            </>
          ) : (
            'Submit Prescription'
          )}
        </button>

        {/* What Happens Next */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What happens next?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 ml-7">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Your prescription will be securely uploaded
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Our AI will analyze and extract medicine information
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              You'll chat with AI assistant about your prescription
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Get explanations, reminders, and guidance
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

