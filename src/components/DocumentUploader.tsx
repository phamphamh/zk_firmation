import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface DocumentUploaderProps {
  onUpload: (file: File) => void;
  acceptedFileTypes?: string[];
}

export default function DocumentUploader({
  onUpload,
  acceptedFileTypes = ['application/pdf', 'image/jpeg', 'image/png']
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Handle the file upload
      const file = acceptedFiles[0];
      onUpload(file);
    } catch (err) {
      setError('Une erreur est survenue lors du téléchargement du document.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-2"></div>
            <p>Téléchargement en cours...</p>
          </div>
        ) : isDragActive ? (
          <p className="text-primary-600">Déposez le document ici...</p>
        ) : (
          <div>
            <p className="mb-2">Glissez et déposez un document ici, ou cliquez pour sélectionner un fichier</p>
            <p className="text-sm text-gray-500">
              (Formats acceptés: PDF, JPEG, PNG)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}