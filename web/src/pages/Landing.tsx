import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
import { getAllScans } from '../lib/api.js';

const FEATURES = [
  { icon: '🔬', title: 'Evidence-Based', desc: 'Every skill is backed by real evidence from your code, resume, and experience.' },
  { icon: '🧬', title: 'Skill DNA Map', desc: 'Interactive visualization showing your skills as a connected knowledge graph.' },
  { icon: '📊', title: 'Strength Clusters', desc: 'Automatically grouped skill clusters reveal your technical specializations.' },
  { icon: '🎯', title: 'Gap Analysis', desc: 'Compare your profile to target roles and see exactly what to learn next.' },
  { icon: '🗺️', title: 'Learning Roadmap', desc: 'Prioritized, dependency-ordered learning plan with time estimates.' },
  { icon: '📅', title: 'Career Timeline', desc: 'Descriptive view of how your skills evolved over your career.' },
];

export function Landing() {
  const savedScans = getAllScans();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="text-6xl">🧬</div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          Decode Your{' '}
          <span className="text-indigo-600">Skill DNA</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Turn your GitHub profile, resume, and experience into an interactive skill genome.
          Understand your strengths, identify gaps, and build a personalized learning roadmap.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/scan/new">
            <Button size="lg">Start Your Scan →</Button>
          </Link>
          {savedScans.length > 0 && (
            <Link to={`/scan/${savedScans[0]!.id}/results?share_token=${savedScans[0]!.token}`}>
              <Button size="lg" variant="secondary">View Last Scan</Button>
            </Link>
          )}
        </div>
        <p className="text-sm text-slate-400">No account required • Free to use • Your data stays private</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} padding="md" className="space-y-2">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-2xl font-bold">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Connect Sources', desc: 'Link your GitHub, upload your resume, or add experience manually.' },
              { step: '2', title: 'Automatic Analysis', desc: 'Our engine extracts skills, maps them to the ESCO taxonomy, and scores evidence strength.' },
              { step: '3', title: 'Explore & Learn', desc: 'Explore your interactive skill map, review gaps, and follow your personalized roadmap.' },
            ].map((s) => (
              <div key={s.step} className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto text-lg">
                  {s.step}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <Link to="/scan/new">
            <Button size="lg" className="mt-4">Get Started Free</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
