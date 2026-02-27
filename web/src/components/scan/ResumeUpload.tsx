import { useState, useRef } from 'react';
import { Button } from '../common/Button.js';

interface ResumeUploadProps {
  onUpload: (file: File) => Promise<void>;
  loading?: boolean;
}

export function ResumeUpload({ onUpload, loading }: ResumeUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF and DOCX files are supported';
    }
    if (file.size > MAX_SIZE) {
      return 'File must be smaller than 10 MB';
    }
    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    const err = validateFile(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
    } else {
      setError('');
      setSelectedFile(file);
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    await onUpload(selectedFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Resume / CV</h3>
        <p className="text-sm text-slate-500 mb-4">
          Upload your resume (PDF or DOCX). We extract skills, projects, and experience from it.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {selectedFile ? (
          <div className="space-y-1">
            <div className="text-2xl">📄</div>
            <p className="font-medium text-slate-900">{selectedFile.name}</p>
            <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📂</div>
            <p className="text-sm font-medium text-slate-700">Drop your resume here or click to browse</p>
            <p className="text-xs text-slate-500">PDF or DOCX, up to 10 MB</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={loading} disabled={!selectedFile} className="w-full">
        Upload Resume
      </Button>
    </form>
  );
}
