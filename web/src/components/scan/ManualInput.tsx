import React, { useState } from 'react';
import { Input, Textarea } from '../common/Input.js';
import { Button } from '../common/Button.js';
import { Badge } from '../common/Badge.js';

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
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">Manual Input</h3>
        <p className="text-sm text-slate-500">
          Add skills, projects, or roles that aren't captured in GitHub or your resume.
        </p>
      </div>

      {/* Skills section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Skills</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Skill name (e.g. TypeScript)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNewRating(r)}
                className={`w-6 h-6 text-sm rounded transition-colors ${r <= newRating ? 'text-amber-500' : 'text-slate-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={addSkill} size="sm">Add</Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                {s.name}
                <span className="text-amber-500">{'★'.repeat(s.selfRating)}</span>
                <button type="button" onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 ml-1">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Projects section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Projects</h4>
        <div className="space-y-2 border border-slate-200 rounded-lg p-3">
          <Input placeholder="Project name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
          <Input placeholder="Tech stack (comma-separated: React, TypeScript, Node.js)" value={newProject.stackStr} onChange={(e) => setNewProject({ ...newProject, stackStr: e.target.value })} />
          <Textarea placeholder="Brief description" rows={2} value={newProject.summary} onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })} />
          <Button type="button" variant="secondary" size="sm" onClick={addProject}>Add Project</Button>
        </div>
        {projects.map((p, i) => (
          <div key={i} className="flex items-start justify-between p-2 bg-slate-50 rounded-lg text-sm">
            <div>
              <span className="font-medium">{p.name}</span>
              <div className="flex gap-1 mt-1 flex-wrap">
                {p.stack.map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
            </div>
            <button type="button" onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">×</button>
          </div>
        ))}
      </div>

      {/* Roles section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Work Experience</h4>
        <div className="space-y-2 border border-slate-200 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Job title" value={newRole.title} onChange={(e) => setNewRole({ ...newRole, title: e.target.value })} />
            <Input placeholder="Company" value={newRole.company} onChange={(e) => setNewRole({ ...newRole, company: e.target.value })} />
          </div>
          <Textarea placeholder="Key accomplishments (one per line)" rows={3} value={newRole.bulletsStr} onChange={(e) => setNewRole({ ...newRole, bulletsStr: e.target.value })} />
          <Button type="button" variant="secondary" size="sm" onClick={addRole}>Add Role</Button>
        </div>
        {roles.map((r, i) => (
          <div key={i} className="flex items-start justify-between p-2 bg-slate-50 rounded-lg text-sm">
            <div>
              <span className="font-medium">{r.title}</span>
              {r.company && <span className="text-slate-500 ml-1">@ {r.company}</span>}
              <div className="text-xs text-slate-500 mt-0.5">{r.bullets.length} bullet(s)</div>
            </div>
            <button type="button" onClick={() => setRoles(roles.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">×</button>
          </div>
        ))}
      </div>

      <Button type="submit" loading={loading} disabled={!hasContent} className="w-full">
        Save Manual Input
      </Button>
    </form>
  );
}
