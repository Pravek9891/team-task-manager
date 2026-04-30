import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { projectsApi, authApi } from '../api';
import { useAuth } from '../context/AuthContext';

function ProjectCard({ project, onEdit, onDelete, onManageMembers }) {
  const { user } = useAuth();
  return (
    <div className="card" id={`project-${project.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ marginBottom: 'var(--space-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.name}
          </h4>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            {project.description || 'No description provided.'}
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'var(--space-3)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(project)} id={`edit-project-${project.id}`}>✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(project.id)} id={`delete-project-${project.id}`}>🗑️</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          👤 {project.owner?.full_name || project.owner?.email}
        </span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          👥 {project.member_count} member{project.member_count !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          📋 {project.task_count} task{project.task_count !== 1 ? 's' : ''}
        </span>
        {user?.role === 'ADMIN' && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onManageMembers(project)}
            style={{ marginLeft: 'auto' }}
            id={`manage-members-${project.id}`}
          >
            Manage Members
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectModal({ isOpen, onClose, onSave, project, users }) {
  const [form, setForm] = useState({ name: '', description: '', member_ids: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || '',
        member_ids: project.members?.map((m) => m.id) || [],
      });
    } else {
      setForm({ name: '', description: '', member_ids: [] });
    }
    setError('');
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (userId) => {
    setForm((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(userId)
        ? prev.member_ids.filter((id) => id !== userId)
        : [...prev.member_ids, userId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{project ? 'Edit Project' : 'New Project'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} id="close-project-modal">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Project Name *</label>
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
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the project..."
              />
            </div>
            {users.length > 0 && (
              <div className="form-group">
                <label className="form-label">Assign Members</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {users.map((u) => (
                    <label
                      key={u.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={form.member_ids.includes(u.id)}
                        onChange={() => toggleMember(u.id)}
                      />
                      {u.full_name} ({u.email})
                      <span className={`badge badge-${u.role.toLowerCase()}`} style={{ marginLeft: 'auto' }}>{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="save-project-btn" disabled={saving}>
              {saving ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
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
    const load = async () => {
      setLoading(true);
      await fetchProjects();
      if (user?.role === 'ADMIN') {
        try {
          const res = await authApi.listUsers();
          setUsers(res.data.results || res.data);
        } catch {}
      }
      setLoading(false);
    };
    load();
  }, [user, fetchProjects]);

  const handleCreate = async (form) => {
    await projectsApi.create(form);
    await fetchProjects();
  };

  const handleEdit = async (form) => {
    await projectsApi.update(editProject.id, form);
    await fetchProjects();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This will also delete all its tasks.')) return;
    await projectsApi.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = editProject ? handleEdit : handleCreate;

  const openCreate = () => {
    setEditProject(null);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditProject(project);
    setModalOpen(true);
  };

  return (
    <AppLayout
      title="Projects"
      actions={
        user?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={openCreate} id="create-project-btn">
            + New Project
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
          <div className="empty-icon">📁</div>
          <div className="empty-text">No projects yet</div>
          <div className="empty-sub">
            {user?.role === 'ADMIN' ? 'Create your first project to get started.' : 'You have not been assigned to any projects.'}
          </div>
          {user?.role === 'ADMIN' && (
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 'var(--space-4)' }}>
              + Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid" id="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEdit}
              onDelete={handleDelete}
              onManageMembers={openEdit}
            />
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        project={editProject}
        users={users}
      />
    </AppLayout>
  );
}
