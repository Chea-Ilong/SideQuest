import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <header className={`sticky top-0 z-40 transition-all duration-200 ${isLanding ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/60' : 'bg-white border-b border-slate-200 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-lg">🧬</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-slate-900 text-sm">Skill DNA</span>
            <span className="text-xs text-slate-400 font-medium">Scanner</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hidden sm:block ${location.pathname === '/' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Home
          </Link>
          <Link
            to="/scan/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow-md transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Scan
          </Link>
        </nav>
      </div>
    </header>
  );
}
