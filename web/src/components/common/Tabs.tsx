import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export function Tabs({ tabs, activeTab, onChange, className = '', variant = 'underline' }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={`flex gap-1 p-1 bg-[#0a0a1a] border-2 border-[#333355] ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-[Silkscreen,monospace] uppercase tracking-wider transition-all duration-75
              ${
                activeTab === tab.id
                  ? 'bg-[#4a3f8f] text-[#00d4ff] border-2 border-[#00d4ff] shadow-[2px_2px_0_#000000]'
                  : 'bg-transparent text-[#888888] border-2 border-transparent hover:text-[#c8c8c8] hover:border-[#333355]'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-0.5 px-1 text-xs ${activeTab === tab.id ? 'text-[#ffd700]' : 'text-[#555577]'}`}>
                [{tab.badge}]
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`border-b-2 border-[#333355] ${className}`}>
      <nav className="flex gap-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-xs font-[Silkscreen,monospace] uppercase tracking-wider transition-all duration-75 whitespace-nowrap border-b-2 -mb-0.5
              ${
                activeTab === tab.id
                  ? 'border-[#00d4ff] text-[#00d4ff] bg-[#0a1a2a]'
                  : 'border-transparent text-[#555577] hover:text-[#888888] hover:border-[#333355] hover:bg-[#0a0a1a]'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-1 text-xs ${activeTab === tab.id ? 'text-[#ffd700]' : 'text-[#333355]'}`}>
                [{tab.badge}]
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
