import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { projectsApi, authApi } from '../api';
import { useAuth } from '../context/AuthContext';

/* ── Project modal ──────────────────────────── */
function ProjectModal({ isOpen, onClose, onSave, project, users }) {
  const [form, setForm] = useState({ name: '', description: '', member_ids: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(project
      ? { name: project.name, description: project.description || '', member_ids: project.members?.map((m) => m.id) || [] }
      : { name: '', description: '', member_ids: [] }
    );
    setError('');
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try { await onSave(form); onClose(); }
    catch (err) { setError(err.response?.data?.name?.[0] || 'Failed to save project.'); }
    finally { setSaving(false); }
  };

  const toggleMember = (id) =>
    setForm((p) => ({
      ...p,
      member_ids: p.member_ids.includes(id) ? p.member_ids.filter((x) => x !== id) : [...p.member_ids, id],
    }));

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{project ? 'Edit project' : 'New project'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} id="close-project-modal">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Project name *</label>
              <input
                id="project-name-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Website Redesign"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                id="project-desc-input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description…"
              />
            </div>

            {users.length > 0 && (
              <div className="form-group">
                <label className="form-label">Team members</label>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {users.map((u) => (
                    <label
                      key={u.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, padding: '5px 4px', borderRadius: 6 }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: 'auto', flexShrink: 0, cursor: 'pointer' }}
                        checked={form.member_ids.includes(u.id)}
                        onChange={() => toggleMember(u.id)}
                      />
                      <span style={{ flex: 1 }}>{u.full_name || u.email}</span>
                      <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="save-project-btn" disabled={saving}>
              {saving ? 'Saving…' : project ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Project card ───────────────────────────── */
function ProjectCard({ project, onEdit, onDelete }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="project-card" id={`project-${project.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="project-card-title">{project.name}</div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(project)} id={`edit-project-${project.id}`}>Edit</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(project.id)} id={`delete-project-${project.id}`} style={{ color: 'var(--red)' }}>Delete</button>
          </div>
        )}
      </div>

      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}

      <div className="project-card-meta">
        <span>
          <span style={{ color: 'var(--text-3)' }}>Owner: </span>
          {project.owner?.full_name || project.owner?.email || '—'}
        </span>
        <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
        <span>{project.task_count} task{project.task_count !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────── */
export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectsApi.list();
      setProjects(res.data.results || res.data);
    } catch {
      setError('Failed to load projects.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchProjects();
      if (isAdmin) {
        try { const r = await authApi.listUsers(); setUsers(r.data.results || r.data); } catch {}
      }
      setLoading(false);
    })();
  }, [isAdmin, fetchProjects]);

  const handleCreate = async (form) => { await projectsApi.create(form); await fetchProjects(); };
  const handleEdit   = async (form) => { await projectsApi.update(editProject.id, form); await fetchProjects(); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? All its tasks will also be deleted.')) return;
    await projectsApi.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const openCreate = () => { setEditProject(null); setModalOpen(true); };
  const openEdit = (p) => { setEditProject(p); setModalOpen(true); };

  return (
    <AppLayout
      title="Projects"
      actions={
        isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={openCreate} id="create-project-btn">
            + New project
          </button>
        )
      }
    >
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">▤</div>
          <div className="empty-title">No projects yet</div>
          <div className="empty-desc">
            {isAdmin ? 'Create your first project to get started.' : 'You haven\'t been assigned to any projects.'}
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}>
              + New project
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid" id="projects-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {isAdmin && (
        <ProjectModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={editProject ? handleEdit : handleCreate}
          project={editProject}
          users={users}
        />
      )}
    </AppLayout>
  );
}
