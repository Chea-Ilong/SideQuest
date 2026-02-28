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
  const MAX_SIZE = 10 * 1024 * 1024;

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF and DOCX files are supported';
    if (file.size > MAX_SIZE) return 'File must be smaller than 10 MB';
    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    const err = validateFile(file);
    if (err) { setError(err); setSelectedFile(null); }
    else { setError(''); setSelectedFile(file); }
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
      {/* Header */}
      <div className="flex items-start gap-3 p-3 bg-[#0a0a1a] border-2 border-[#333355]">
        <div className="w-10 h-10 bg-[#1a0a2a] border-2 border-[#7b2d8b] flex items-center justify-center flex-shrink-0 text-xl">
          📄
        </div>
        <div>
          <h3 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">Resume / CV Upload</h3>
          <p className="font-[Silkscreen,monospace] text-xs text-[#333355] mt-0.5 leading-relaxed">
            Upload your resume (PDF or DOCX). We extract skills, projects, and experience.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`
          border-2 p-8 text-center transition-all duration-75
          ${dragOver
            ? 'border-[#00d4ff] bg-[#0a1a2a] shadow-[0_0_12px_rgba(0,212,255,0.3)]'
            : selectedFile
              ? 'border-[#00ff88] bg-[#003322] cursor-default'
              : 'border-[#4a3f8f] bg-[#0a0a1a] hover:border-[#7b6fcf] hover:bg-[#12122a] cursor-pointer'
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
            <div className="text-3xl">✅</div>
            <div>
              <p className="font-[Silkscreen,monospace] text-xs text-[#00ff88] uppercase tracking-wider">{selectedFile.name}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="font-[Silkscreen,monospace] text-xs text-[#00aa55] bg-[#003322] border border-[#00aa55] px-2 py-0.5">
                  {fileExtension}
                </span>
                <span className="font-[Silkscreen,monospace] text-xs text-[#555577]">{fileSizeKB} KB</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="font-[Silkscreen,monospace] text-xs text-[#ff2244] hover:text-[#ff4466] uppercase tracking-wider transition-colors duration-75"
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`text-4xl ${dragOver ? 'pixel-pulse' : ''}`}>📂</div>
            <div>
              <p className="font-[Silkscreen,monospace] text-xs text-[#888888] uppercase tracking-wider">
                {dragOver ? 'Drop file here' : 'Drop resume here or click to browse'}
              </p>
              <p className="font-[Silkscreen,monospace] text-xs text-[#333355] mt-1">PDF or DOCX, up to 10 MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 font-[Silkscreen,monospace] text-xs text-[#ff2244] bg-[#330011] border-2 border-[#aa0022] p-3">
          <span>▶</span>
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" loading={loading} disabled={!selectedFile} className="w-full" variant="gradient">
        ▶ Upload Resume
      </Button>
    </form>
  );
}
