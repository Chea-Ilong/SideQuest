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

  const fileExtension = selectedFile?.name.split('.').pop()?.toUpperCase() ?? '';
  const fileSizeKB = selectedFile ? (selectedFile.size / 1024).toFixed(0) : '0';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-xl">
          📄
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Resume / CV Upload</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Upload your resume (PDF or DOCX). We extract skills, projects, and experience from it.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200
          ${dragOver
            ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
            : selectedFile
              ? 'border-emerald-300 bg-emerald-50 cursor-default'
              : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer'
          }
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
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{selectedFile.name}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {fileExtension}
                </span>
                <span className="text-xs text-slate-400">{fileSizeKB} KB</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); fileInputRef.current!.value = ''; }}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1 mx-auto"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-colors ${dragOver ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              <svg className={`w-7 h-7 transition-colors ${dragOver ? 'text-indigo-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {dragOver ? 'Drop your file here' : 'Drop your resume here or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF or DOCX, up to 10 MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" loading={loading} disabled={!selectedFile} className="w-full" variant="gradient">
        Upload Resume
      </Button>
    </form>
  );
}
