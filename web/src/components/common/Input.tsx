import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-[Silkscreen,monospace] uppercase tracking-wider text-[#888888]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 text-sm font-[Silkscreen,monospace]
          bg-[#0a0a1a] text-[#c8c8c8]
          border-2 shadow-[2px_2px_0_#000000]
          placeholder:text-[#333355]
          focus:outline-none focus:border-[#00d4ff] focus:shadow-[2px_2px_0_#000000,0_0_8px_rgba(0,212,255,0.3)]
          disabled:bg-[#050510] disabled:text-[#333355] disabled:cursor-not-allowed
          transition-all duration-75
          ${error ? 'border-[#ff2244] focus:border-[#ff2244]' : 'border-[#4a3f8f] hover:border-[#7b6fcf]'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs font-[Silkscreen,monospace] text-[#ff2244]">
          ▶ {error}
        </p>
      )}
      {hint && !error && <p className="text-xs font-[Silkscreen,monospace] text-[#555577]">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-[Silkscreen,monospace] uppercase tracking-wider text-[#888888]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full px-3 py-2 text-sm font-[Silkscreen,monospace]
          bg-[#0a0a1a] text-[#c8c8c8]
          border-2 shadow-[2px_2px_0_#000000]
          placeholder:text-[#333355]
          focus:outline-none focus:border-[#00d4ff] focus:shadow-[2px_2px_0_#000000,0_0_8px_rgba(0,212,255,0.3)]
          disabled:bg-[#050510] disabled:text-[#333355] disabled:cursor-not-allowed
          resize-y transition-all duration-75
          ${error ? 'border-[#ff2244] focus:border-[#ff2244]' : 'border-[#4a3f8f] hover:border-[#7b6fcf]'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs font-[Silkscreen,monospace] text-[#ff2244]">
          ▶ {error}
        </p>
      )}
      {hint && !error && <p className="text-xs font-[Silkscreen,monospace] text-[#555577]">{hint}</p>}
    </div>
  );
}
