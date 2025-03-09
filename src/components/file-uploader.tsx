import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
  onFileUpload?: (file: File) => void;
  onFileSelect?: (file: File | null) => void;
  selectedFile?: File | null;
  accept?: Record<string, string[]>;
  className?: string;
}

export function FileUploader({
  onFileUpload,
  onFileSelect,
  selectedFile,
  accept,
  className
}: FileUploaderProps) {
  // Utiliser soit le fichier fourni, soit un état local
  const [localFile, setLocalFile] = useState<File | null>(null);
  const file = selectedFile !== undefined ? selectedFile : localFile;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];

      // Mise à jour de l'état local si nécessaire
      if (selectedFile === undefined) {
        setLocalFile(selectedFile);
      }

      // Appel des callbacks de l'ancienne et de la nouvelle API
      if (onFileUpload) {
        onFileUpload(selectedFile);
      }

      if (onFileSelect) {
        onFileSelect(selectedFile);
      }
    }
  }, [onFileUpload, onFileSelect, selectedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
  });

  // Fonction pour réinitialiser le fichier
  const resetFile = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (selectedFile === undefined) {
      setLocalFile(null);
    }

    if (onFileSelect) {
      onFileSelect(null);
    }

    if (onFileUpload) {
      onFileUpload(null as any); // hack pour la compatibilité
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 transition-colors',
          'flex flex-col items-center justify-center text-center cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
        )}
      >
        <input {...getInputProps()} />
        <div className="bg-background size-12 grid place-items-center rounded-xl shadow-lg ring-1 ring-border mb-4">
          {file
            ? <FileText className="w-6 h-6 text-primary" />
            : <Upload className="w-6 h-6 text-muted-foreground" />
          }
        </div>

        {file ? (
          <div>
            <h3 className="font-medium text-foreground">Fichier prêt</h3>
            <p className="text-sm text-muted-foreground mt-1">{file.name}</p>
            <div className="flex gap-2 mt-3 justify-center">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={resetFile}
              >
                Changer
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-medium text-foreground">
              {isDragActive ? 'Déposez votre document ici' : 'Téléverser votre document'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Formats acceptés: PDF, JPG, PNG
            </p>
            <Button
              className="mt-3"
              size="sm"
              type="button"
            >
              Parcourir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}