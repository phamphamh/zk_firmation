import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, FilePlus2 } from 'lucide-react';
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
  const [file, setFile] = useState<File | null>(selectedFile || null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);

      if (onFileSelect) {
        onFileSelect(selectedFile);
      }

      if (onFileUpload) {
        onFileUpload(selectedFile);
      }
    }
  }, [onFileUpload, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    noClick: !!file,
    noKeyboard: !!file
  });

  const resetFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);

    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  return (
    <div
      className={cn(
        'w-full',
        className
      )}
    >
      <div
        {...getRootProps()}
        className={cn(
          'relative w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 transition-all cursor-pointer overflow-hidden group',
          file ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60' :
                 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/30',
          isDragActive && 'border-indigo-500 dark:border-indigo-400 bg-indigo-100/80 dark:bg-indigo-900/40'
        )}
      >
        <input {...getInputProps()} />

        {/* Mesh Gradient */}
        <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none z-0 overflow-hidden">
          <div className={cn(
            "absolute w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-color),0.3),transparent_40%)]",
            isDragActive && "animate-pulse"
          )}></div>
        </div>

        {file ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm transition-all mb-3 group-hover:shadow-md">
              <FileText className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mr-3 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={resetFile}
                className="ml-2 p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label="Supprimer le fichier"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Cliquez sur le bouton <span className="font-medium">Changer</span> pour sélectionner un autre fichier
            </p>

            <Button
              type="button"
              onClick={open}
              className="mt-2 text-xs py-1 px-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/60 dark:text-indigo-300"
              variant="ghost"
            >
              Changer
            </Button>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FilePlus2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">
              Glissez-déposez un fichier ici ou cliquez pour parcourir
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              PDF, DOC, DOCX, JPG, PNG (max. 10MB)
            </p>
            <Button
              type="button"
              onClick={open}
              className="bg-indigo-500 hover:bg-indigo-600 text-white dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              Sélectionner un fichier
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}