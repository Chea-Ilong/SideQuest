import React, { useState } from 'react';
import { Input, Textarea } from '../common/Input.js';
import { Button } from '../common/Button.js';

interface Skill { name: string; selfRating: number; }
interface Project { name: string; summary: string; stack: string[]; }
interface Role { title: string; company: string; bullets: string[]; }

interface ManualInputProps {
  onSubmit: (data: {
    skills: Skill[];
    projects: Project[];
    roles: Role[];
  }) => Promise<void>;
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
    setProjects((prev) => [
      ...prev,
      {
        name: newProject.name.trim(),
        summary: newProject.summary.trim(),
        stack: newProject.stackStr.split(',').map((s) => s.trim()).filter(Boolean),
      },
    ]);
    setNewProject({ name: '', summary: '', stackStr: '' });
  }

  function addRole() {
    if (!newRole.title.trim()) return;
    setRoles((prev) => [
      ...prev,
      {
        title: newRole.title.trim(),
        company: newRole.company.trim(),
        bullets: newRole.bulletsStr.split('\n').map((s) => s.trim()).filter(Boolean),
      },
    ]);
    setNewRole({ title: '', company: '', bulletsStr: '' });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ skills, projects, roles });
  };

  const hasContent = skills.length > 0 || projects.length > 0 || roles.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 text-xl">
          ✏️
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Manual Input</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Add skills, projects, or roles that aren't captured in GitHub or your resume.
          </p>
        </div>
      </div>

      {/* Skills section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-700">Skills</h4>
          {skills.length > 0 && (
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {skills.length} added
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
                className={`w-7 h-7 text-lg transition-all ${r <= newRating ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
              >
                ★
              </button>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={addSkill} size="sm">Add</Button>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            {skills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium shadow-sm">
                {s.name}
                <span className="text-amber-400 text-xs">{'★'.repeat(s.selfRating)}</span>
                <button
                  type="button"
                  onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                  className="text-slate-300 hover:text-red-500 transition-colors ml-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Projects section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-700">Projects</h4>
          {projects.length > 0 && (
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {projects.length} added
            </span>
          )}
        </div>

        <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <Input
            placeholder="Project name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <Input
            placeholder="Tech stack (comma-separated: React, TypeScript, Node.js)"
            value={newProject.stackStr}
            onChange={(e) => setNewProject({ ...newProject, stackStr: e.target.value })}
          />
          <Textarea
            placeholder="Brief description of the project"
            rows={2}
            value={newProject.summary}
            onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addProject}>
            + Add Project
          </Button>
        </div>

        {projects.map((p, i) => (
          <div key={i} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm">
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-slate-800">{p.name}</span>
              {p.summary && <p className="text-xs text-slate-500 mt-0.5 truncate">{p.summary}</p>}
              {p.stack.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {p.stack.map((t) => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setProjects(projects.filter((_, j) => j !== i))}
              className="text-slate-300 hover:text-red-500 transition-colors ml-3 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Roles section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-700">Work Experience</h4>
          {roles.length > 0 && (
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {roles.length} added
            </span>
          )}
        </div>

        <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Job title"
              value={newRole.title}
              onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
            />
            <Input
              placeholder="Company"
              value={newRole.company}
              onChange={(e) => setNewRole({ ...newRole, company: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="Key accomplishments (one per line)"
            rows={3}
            value={newRole.bulletsStr}
            onChange={(e) => setNewRole({ ...newRole, bulletsStr: e.target.value })}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addRole}>
            + Add Role
          </Button>
        </div>

        {roles.map((r, i) => (
          <div key={i} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm">
            <div>
              <span className="font-semibold text-slate-800">{r.title}</span>
              {r.company && <span className="text-slate-500 ml-1.5">@ {r.company}</span>}
              <div className="text-xs text-slate-400 mt-0.5">{r.bullets.length} bullet{r.bullets.length !== 1 ? 's' : ''}</div>
            </div>
            <button
              type="button"
              onClick={() => setRoles(roles.filter((_, j) => j !== i))}
              className="text-slate-300 hover:text-red-500 transition-colors ml-3 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <Button type="submit" loading={loading} disabled={!hasContent} className="w-full" variant="gradient">
        Save Manual Input
      </Button>
    </form>
  );
}
