import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  const navLink = (to: string, label: string) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`text-xs font-[Silkscreen,monospace] uppercase tracking-wider transition-all duration-75 px-2 py-1 hidden sm:block ${
          isActive
            ? 'text-[#00d4ff] border-b-2 border-[#00d4ff]'
            : 'text-[#555577] hover:text-[#888888] border-b-2 border-transparent'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a1a] border-b-2 border-[#4a3f8f] shadow-[0_4px_0_#000000]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-[#4a3f8f] border-2 border-[#7b6fcf] shadow-[2px_2px_0_#000000] flex items-center justify-center text-base">
            🧬
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-[Press_Start_2P,monospace] text-xs text-[#00d4ff] tracking-wider" style={{ textShadow: '0 0 8px #00d4ff' }}>
              SKILL DNA
            </span>
            <span className="font-[Silkscreen,monospace] text-xs text-[#555577] tracking-widest uppercase">
              Scanner
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-4">
          {navLink('/', 'Home')}
          {navLink('/scans', 'History')}
          <Link
            to="/scan/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-[Silkscreen,monospace] uppercase tracking-wider bg-[#4a3f8f] text-[#00d4ff] border-2 border-[#00d4ff] shadow-[2px_2px_0_#000000] hover:bg-[#5a4f9f] hover:text-[#ffffff] active:translate-y-[2px] active:shadow-none transition-all duration-75"
          >
            + New Scan
          </Link>
        </nav>
      </div>
    </header>
  );
}
