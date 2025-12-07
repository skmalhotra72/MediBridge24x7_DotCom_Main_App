import { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
  bucket: string;
  folder: string;
  onUploadComplete: (url: string, filePath: string) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
}

export const FileUpload = ({
  bucket,
  folder,
  onUploadComplete,
  acceptedFileTypes = 'image/*,application/pdf',
  maxSizeMB = 10,
  label = 'Upload File',
  description = 'PDF or Image files',
}: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setUploadProgress(100);

      toast.success('File uploaded successfully');
      onUploadComplete(urlData.publicUrl, filePath);

      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-8 h-8" />;
    if (file.type.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
        <p className="text-xs text-slate-500 mb-3">{description} (Max {maxSizeMB}MB)</p>

        {!file ? (
          <label className="flex flex-col items-center justify-center w-full h-48 px-4 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-750 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
              <Upload className="w-12 h-12 mb-3" />
              <p className="mb-2 text-sm">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs">{description}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        ) : (
          <div className="border-2 border-slate-700 rounded-lg bg-slate-800 p-4">
            <div className="flex items-start space-x-4">
              {previewUrl ? (
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500">
                  {getFileIcon()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatFileSize(file.size)}</p>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={handleRemoveFile}
                      className="ml-2 p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadProgress === 100 && !isUploading && (
                  <div className="flex items-center space-x-2 mt-2 text-green-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Upload complete</span>
                  </div>
                )}
              </div>
            </div>

            {!isUploading && uploadProgress === 0 && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
                >
                  Upload File
                </button>
                <button
                  onClick={handleRemoveFile}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
