'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, FileCode, CheckCircle2 } from 'lucide-react';

export interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
}

export function FileUpload({
  label,
  description,
  accept = '*/*',
  multiple = false,
  onFilesChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const updated = multiple ? [...files, ...newFiles] : newFiles;
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  return (
    <Card className="border border-white/10 bg-[#0c0307] shadow-2xl backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white uppercase tracking-wider">{label}</CardTitle>
        {description && <p className="text-xs text-white/60">{description}</p>}
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 ${
            isDragging
              ? 'border-[#ff1053] bg-[#ff1053]/15 scale-[0.99]'
              : 'border-white/15 bg-black/30 hover:border-[#ff1053]/40'
          }`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff1053]/10 text-[#ff1053] mb-3 border border-[#ff1053]/20">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="font-heading font-semibold text-sm text-white">
            Drag and drop your files here
          </p>
          <p className="mt-1 text-xs text-white/50">or click browse</p>
          <label className="mt-4 inline-block cursor-pointer">
            <Button type="button" variant="secondary" size="sm" className="pointer-events-none uppercase tracking-wider text-xs">
              Browse Files
            </Button>
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleChange}
              className="hidden"
            />
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#ff1053]">
              Attached ({files.length})
            </p>
            <div className="space-y-1.5">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-2.5 sm:p-3 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="h-4 w-4 text-[#ff1053] shrink-0" />
                    <span className="text-xs font-medium text-white truncate">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[11px] font-mono text-white/40">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 rounded-md text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

