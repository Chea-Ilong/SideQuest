import React, { useState } from 'react';
import { Input, Textarea } from '../common/Input.js';
import { Button } from '../common/Button.js';

interface Skill { name: string; selfRating: number; }
interface Project { name: string; summary: string; stack: string[]; }
interface Role { title: string; company: string; bullets: string[]; }

interface ManualInputProps {
  onSubmit: (data: { skills: Skill[]; projects: Project[]; roles: Role[] }) => Promise<void>;
  loading?: boolean;
}

export function ManualInput({ onSubmit, loading }: ManualInputProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newRating, setNewRating] = useState(3);

  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ name: '', summary: '', stackStr: '' });

  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState({ title: '', company: '', bulletsStr: '' });

  function addSkill() {
    if (!newSkill.trim()) return;
    setSkills((prev) => [...prev, { name: newSkill.trim(), selfRating: newRating }]);
    setNewSkill('');
    setNewRating(3);
  }

  function addProject() {
    if (!newProject.name.trim()) return;
    setProjects((prev) => [...prev, {
      name: newProject.name.trim(),
      summary: newProject.summary.trim(),
      stack: newProject.stackStr.split(',').map((s) => s.trim()).filter(Boolean),
    }]);
    setNewProject({ name: '', summary: '', stackStr: '' });
  }

  function addRole() {
    if (!newRole.title.trim()) return;
    setRoles((prev) => [...prev, {
      title: newRole.title.trim(),
      company: newRole.company.trim(),
      bullets: newRole.bulletsStr.split('\n').map((s) => s.trim()).filter(Boolean),
    }]);
    setNewRole({ title: '', company: '', bulletsStr: '' });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ skills, projects, roles });
  };

  const hasContent = skills.length > 0 || projects.length > 0 || roles.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-3 bg-[#0a0a1a] border-2 border-[#333355]">
        <div className="w-10 h-10 bg-[#1a0a2a] border-2 border-[#7b2d8b] flex items-center justify-center flex-shrink-0 text-xl">
          ✏️
        </div>
        <div>
          <h3 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">Manual Input</h3>
          <p className="font-[Silkscreen,monospace] text-xs text-[#333355] mt-0.5 leading-relaxed">
            Add skills, projects, or roles not captured in GitHub or your resume.
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">Skills</h4>
          {skills.length > 0 && (
            <span className="font-[Silkscreen,monospace] text-xs text-[#00d4ff] bg-[#0a1a2a] border border-[#0088aa] px-2 py-0.5">
              {skills.length}
            </span>
          )}
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Skill name (e.g. TypeScript)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
          </div>
          <div className="flex items-center gap-0.5 pb-0.5">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNewRating(r)}
                className={`w-6 h-6 font-[Silkscreen,monospace] text-base transition-all duration-75 ${r <= newRating ? 'text-[#ffd700]' : 'text-[#333355] hover:text-[#555577]'}`}
              >
                ★
              </button>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={addSkill} size="sm">Add</Button>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-[#0a0a1a] border-2 border-[#333355]">
            {skills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#1a1a2e] border-2 border-[#4a3f8f] font-[Silkscreen,monospace] text-xs text-[#c8c8c8] shadow-[1px_1px_0_#000000]">
                {s.name}
                <span className="text-[#ffd700] text-xs">{'★'.repeat(s.selfRating)}</span>
                <button
                  type="button"
                  onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                  className="text-[#555577] hover:text-[#ff2244] transition-colors duration-75 ml-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">Projects</h4>
          {projects.length > 0 && (
            <span className="font-[Silkscreen,monospace] text-xs text-[#00d4ff] bg-[#0a1a2a] border border-[#0088aa] px-2 py-0.5">
              {projects.length}
            </span>
          )}
        </div>

        <div className="space-y-2 bg-[#0a0a1a] border-2 border-[#333355] p-4">
          <Input placeholder="Project name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
          <Input placeholder="Tech stack (comma-separated: React, TypeScript, Node.js)" value={newProject.stackStr} onChange={(e) => setNewProject({ ...newProject, stackStr: e.target.value })} />
          <Textarea placeholder="Brief description" rows={2} value={newProject.summary} onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })} />
          <Button type="button" variant="secondary" size="sm" onClick={addProject}>+ Add Project</Button>
        </div>

        {projects.map((p, i) => (
          <div key={i} className="flex items-start justify-between p-3 bg-[#12122a] border-2 border-[#333355] shadow-[1px_1px_0_#000000]">
            <div className="flex-1 min-w-0">
              <span className="font-[Silkscreen,monospace] text-xs text-[#c8c8c8] uppercase tracking-wider">{p.name}</span>
              {p.summary && <p className="font-[Silkscreen,monospace] text-xs text-[#555577] mt-0.5 truncate">{p.summary}</p>}
              {p.stack.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {p.stack.map((t) => (
                    <span key={t} className="font-[Silkscreen,monospace] text-xs bg-[#0a0a1a] text-[#888888] border border-[#333355] px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-[#555577] hover:text-[#ff2244] transition-colors duration-75 ml-3 flex-shrink-0 font-[Silkscreen,monospace] text-xs">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Roles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-[Silkscreen,monospace] text-xs uppercase tracking-wider text-[#888888]">Work Experience</h4>
          {roles.length > 0 && (
            <span className="font-[Silkscreen,monospace] text-xs text-[#00d4ff] bg-[#0a1a2a] border border-[#0088aa] px-2 py-0.5">
              {roles.length}
            </span>
          )}
        </div>

        <div className="space-y-2 bg-[#0a0a1a] border-2 border-[#333355] p-4">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Job title" value={newRole.title} onChange={(e) => setNewRole({ ...newRole, title: e.target.value })} />
            <Input placeholder="Company" value={newRole.company} onChange={(e) => setNewRole({ ...newRole, company: e.target.value })} />
          </div>
          <Textarea placeholder="Key accomplishments (one per line)" rows={3} value={newRole.bulletsStr} onChange={(e) => setNewRole({ ...newRole, bulletsStr: e.target.value })} />
          <Button type="button" variant="secondary" size="sm" onClick={addRole}>+ Add Role</Button>
        </div>

        {roles.map((r, i) => (
          <div key={i} className="flex items-start justify-between p-3 bg-[#12122a] border-2 border-[#333355] shadow-[1px_1px_0_#000000]">
            <div>
              <span className="font-[Silkscreen,monospace] text-xs text-[#c8c8c8] uppercase tracking-wider">{r.title}</span>
              {r.company && <span className="font-[Silkscreen,monospace] text-xs text-[#555577] ml-1.5">@ {r.company}</span>}
              <div className="font-[Silkscreen,monospace] text-xs text-[#333355] mt-0.5">{r.bullets.length} bullet{r.bullets.length !== 1 ? 's' : ''}</div>
            </div>
            <button type="button" onClick={() => setRoles(roles.filter((_, j) => j !== i))} className="text-[#555577] hover:text-[#ff2244] transition-colors duration-75 ml-3 flex-shrink-0 font-[Silkscreen,monospace] text-xs">
              ✕
            </button>
          </div>
        ))}
      </div>

      <Button type="submit" loading={loading} disabled={!hasContent} className="w-full" variant="gradient">
        ▶ Save Manual Input
      </Button>
    </form>
  );
}
