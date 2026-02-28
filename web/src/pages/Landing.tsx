import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.js';
import { getAllScans } from '../lib/api.js';

const FEATURES = [
  { icon: '🔬', title: 'Evidence-Based', desc: 'Every skill backed by real evidence from your code, resume, and experience.', color: '#00d4ff' },
  { icon: '🧬', title: 'Skill DNA Map', desc: 'Interactive force graph showing your skills as a connected knowledge network.', color: '#bf7fff' },
  { icon: '📊', title: 'Strength Clusters', desc: 'Auto-grouped skill clusters reveal your technical specializations.', color: '#ffd700' },
  { icon: '🎯', title: 'Gap Analysis', desc: 'Compare your profile to target roles and see exactly what to learn next.', color: '#ff2244' },
  { icon: '🗺️', title: 'Learning Roadmap', desc: 'Prioritized, dependency-ordered learning plan with time estimates.', color: '#ff8c00' },
  { icon: '📅', title: 'Career Timeline', desc: 'Descriptive view of how your skills evolved over your career.', color: '#00ff88' },
];

const STEPS = [
  { step: '01', title: 'Connect Sources', desc: 'Link GitHub, upload resume, or add experience manually.', icon: '🔗' },
  { step: '02', title: 'Auto Analysis', desc: 'Engine extracts skills, maps to ESCO taxonomy, scores evidence.', icon: '⚡' },
  { step: '03', title: 'Explore & Learn', desc: 'Explore skill map, review gaps, follow your roadmap.', icon: '🚀' },
];

export function Landing() {
  const savedScans = getAllScans();

  return (
    <div className="min-h-screen pixel-stars-bg">
      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
        {/* Decorative pixel corners */}
        <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#4a3f8f] opacity-60" />
        <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[#4a3f8f] opacity-60" />
        <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[#4a3f8f] opacity-60" />
        <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[#4a3f8f] opacity-60" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a1a2a] border-2 border-[#00d4ff] shadow-[2px_2px_0_#000000] text-xs font-[Silkscreen,monospace] uppercase tracking-wider text-[#00d4ff] mb-8">
          <span className="w-2 h-2 bg-[#00d4ff] pixel-pulse" />
          AI-Powered Skill Intelligence
        </div>

        {/* Title */}
        <h1 className="font-[Press_Start_2P,monospace] text-2xl md:text-3xl lg:text-4xl leading-relaxed mb-6" style={{ textShadow: '3px 3px 0 #000000' }}>
          <span className="text-[#f0f0f0]">DECODE YOUR</span>
          <br />
          <span className="text-[#00d4ff]" style={{ textShadow: '0 0 16px #00d4ff, 3px 3px 0 #000000' }}>SKILL DNA</span>
        </h1>

        <p className="font-[Silkscreen,monospace] text-sm text-[#888888] max-w-2xl mx-auto mb-10 leading-relaxed">
          Turn your GitHub profile, resume, and experience into an interactive skill genome.
          Understand your strengths, identify gaps, and build a personalized learning roadmap.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
          <Link to="/scan/new">
            <Button variant="gradient" size="lg">
              ▶ Start Your Scan
            </Button>
          </Link>
          {savedScans.length > 0 && (
            <Link to={`/scan/${savedScans[0]!.id}/results?share_token=${savedScans[0]!.token}`}>
              <Button size="lg" variant="secondary">
                ◀ View Last Scan
              </Button>
            </Link>
          )}
        </div>

        <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">
          NO ACCOUNT REQUIRED • FREE TO USE • YOUR DATA STAYS PRIVATE
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
          {[
            { value: '3,000+', label: 'ESCO Skills' },
            { value: '6', label: 'Analysis Views' },
            { value: '100%', label: 'Evidence-Based' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-[Press_Start_2P,monospace] text-xl text-[#ffd700]" style={{ textShadow: '2px 2px 0 #000000' }}>
                {stat.value}
              </div>
              <div className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-[Press_Start_2P,monospace] text-lg text-[#f0f0f0] mb-3" style={{ textShadow: '2px 2px 0 #000000' }}>
            FEATURES
          </h2>
          <div className="pixel-divider max-w-xs mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-[#12122a] border-2 border-[#333355] shadow-[4px_4px_0_#000000] p-5 hover:border-[#4a3f8f] transition-all duration-75 group"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3
                className="font-[Silkscreen,monospace] text-sm uppercase tracking-wider mb-2"
                style={{ color: f.color, textShadow: `0 0 8px ${f.color}` }}
              >
                {f.title}
              </h3>
              <p className="font-[Silkscreen,monospace] text-xs text-[#555577] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#050510] border-t-2 border-b-2 border-[#333355] py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-[Press_Start_2P,monospace] text-lg text-[#f0f0f0] mb-3" style={{ textShadow: '2px 2px 0 #000000' }}>
            HOW IT WORKS
          </h2>
          <div className="pixel-divider max-w-xs mx-auto mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative space-y-4">
                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-[#333355]" />
                )}
                <div className="relative">
                  <div className="w-16 h-16 bg-[#4a3f8f] border-2 border-[#7b6fcf] shadow-[4px_4px_0_#000000] flex items-center justify-center text-2xl mx-auto">
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#0a0a1a] border-2 border-[#00d4ff] flex items-center justify-center">
                    <span className="font-[Press_Start_2P,monospace] text-xs text-[#00d4ff]">{i + 1}</span>
                  </div>
                </div>
                <h3 className="font-[Silkscreen,monospace] text-sm uppercase tracking-wider text-[#c8c8c8]">{s.title}</h3>
                <p className="font-[Silkscreen,monospace] text-xs text-[#555577] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <Link to="/scan/new">
            <Button variant="gradient" size="lg">
              ▶ Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-[#333355] py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#4a3f8f] border-2 border-[#7b6fcf] flex items-center justify-center text-xs">
              🧬
            </div>
            <span className="font-[Silkscreen,monospace] text-xs text-[#555577] uppercase tracking-wider">
              Skill DNA Scanner
            </span>
          </div>
          <p className="font-[Silkscreen,monospace] text-xs text-[#333355]">
            Built with ESCO taxonomy • Evidence-based skill analysis
          </p>
        </div>
      </footer>
    </div>
  );
}
