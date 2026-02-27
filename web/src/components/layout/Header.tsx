import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
          <span className="text-2xl">🧬</span>
          <span>Skill DNA Scanner</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/scan/new"
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            New Scan
          </Link>
        </nav>
      </div>
    </header>
  );
}
