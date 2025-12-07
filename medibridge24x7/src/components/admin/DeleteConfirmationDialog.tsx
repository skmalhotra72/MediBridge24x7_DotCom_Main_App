import { AlertCircle } from 'lucide-react';
import { Button } from '../index';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  isLoading?: boolean;
}

export const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}: DeleteConfirmationDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-accent-900 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-accent-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-300">{message}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="bg-accent-600 hover:bg-accent-700"
          >
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
};
