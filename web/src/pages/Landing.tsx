import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.js';
import { getAllScans } from '../lib/api.js';

const FEATURES = [
  {
    icon: '🔬',
    title: 'Evidence-Based',
    desc: 'Every skill is backed by real evidence from your code, resume, and experience.',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
  },
  {
    icon: '🧬',
    title: 'Skill DNA Map',
    desc: 'Interactive visualization showing your skills as a connected knowledge graph.',
    color: 'from-indigo-500 to-violet-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: '📊',
    title: 'Strength Clusters',
    desc: 'Automatically grouped skill clusters reveal your technical specializations.',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
  },
  {
    icon: '🎯',
    title: 'Gap Analysis',
    desc: 'Compare your profile to target roles and see exactly what to learn next.',
    color: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50',
  },
  {
    icon: '🗺️',
    title: 'Learning Roadmap',
    desc: 'Prioritized, dependency-ordered learning plan with time estimates.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    icon: '📅',
    title: 'Career Timeline',
    desc: 'Descriptive view of how your skills evolved over your career.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Connect Sources',
    desc: 'Link your GitHub, upload your resume, or add experience manually.',
    icon: '🔗',
  },
  {
    step: '02',
    title: 'Automatic Analysis',
    desc: 'Our engine extracts skills, maps them to the ESCO taxonomy, and scores evidence strength.',
    icon: '⚡',
  },
  {
    step: '03',
    title: 'Explore & Learn',
    desc: 'Explore your interactive skill map, review gaps, and follow your personalized roadmap.',
    icon: '🚀',
  },
];

export function Landing() {
  const savedScans = getAllScans();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        {/* Background decoration */}
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-sm text-indigo-700 font-medium mb-8">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            AI-Powered Skill Intelligence
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
            Decode Your{' '}
            <span className="gradient-text">Skill DNA</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Turn your GitHub profile, resume, and experience into an interactive skill genome.
            Understand your strengths, identify gaps, and build a personalized learning roadmap.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
            <Link to="/scan/new">
              <Button variant="gradient" size="lg" className="shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300">
                Start Your Scan →
              </Button>
            </Link>
            {savedScans.length > 0 && (
              <Link to={`/scan/${savedScans[0]!.id}/results?share_token=${savedScans[0]!.token}`}>
                <Button size="lg" variant="secondary">
                  View Last Scan
                </Button>
              </Link>
            )}
          </div>

          <p className="text-sm text-slate-400">
            No account required • Free to use • Your data stays private
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
            {[
              { value: '3,000+', label: 'ESCO Skills' },
              { value: '6', label: 'Analysis Views' },
              { value: '100%', label: 'Evidence-Based' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything you need to understand your skills</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Six powerful views to analyze, visualize, and grow your technical expertise.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all duration-200 animate-fade-in-up"
            >
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm text-slate-300 font-medium mb-8">
            Simple 3-step process
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
          <p className="text-slate-400 mb-16 max-w-lg mx-auto">Get your complete skill profile in minutes, not hours.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-indigo-500/50 to-transparent" />
                )}
                <div className="relative space-y-4">
                  <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                    <span className="text-2xl">{s.icon}</span>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-400">{i + 1}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white text-lg">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/scan/new">
            <Button variant="gradient" size="lg" className="shadow-lg shadow-indigo-900/50">
              Get Started Free →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-sm">🧬</span>
            </div>
            <span className="text-sm font-semibold text-slate-700">Skill DNA Scanner</span>
          </div>
          <p className="text-xs text-slate-400">Built with ESCO taxonomy • Evidence-based skill analysis</p>
        </div>
      </footer>
    </div>
  );
}
