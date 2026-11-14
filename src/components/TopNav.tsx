import React from 'react';

export type AppSection =
  | 'home'
  | 'explorer'
  | 'discovery'
  | 'builder'
  | 'laboratory'
  | 'trends'
  | 'reports'
  | 'sources';

interface TopNavProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  hasResults: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeSection,
  onNavigate,
  hasResults,
}) => {
  const navItems: Array<{ id: AppSection; label: string; groupMatch?: AppSection[] }> = [
    { id: 'home', label: 'Overview' },
    { id: 'explorer', label: 'Earth Explorer' },
    { id: 'discovery', label: 'Data Discovery' },
    {
      id: 'laboratory',
      label: 'Analysis Lab',
      groupMatch: ['laboratory', 'trends', 'reports'],
    },
    { id: 'sources', label: 'Data Sources' },
  ];

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-slate-800/90 bg-[#07090E]/95 px-6">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="font-display text-lg font-bold tracking-tight text-slate-100 hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          EarthPulse
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6"
        >
          {navItems.map((item) => {
            const isActive =
              activeSection === item.id ||
              (item.groupMatch ? item.groupMatch.includes(activeSection) : false);
            const targetId =
              item.id === 'laboratory' && !hasResults ? 'builder' : item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(targetId)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-slate-300 hover:text-slate-100'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-cyan-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('builder')}
            className="rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Investigation
          </button>
        </div>
      </div>
    </header>
  );
};
