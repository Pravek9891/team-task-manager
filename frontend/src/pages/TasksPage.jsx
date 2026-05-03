import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { tasksApi, projectsApi, authApi } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const STATUS_CLS   = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in_progress', DONE: 'badge-done' };

/* ── Task Create/Edit Modal (Admin only) ────── */
function TaskModal({ isOpen, onClose, onSave, task, projects, users }) {
  const blank = { title: '', description: '', project: '', assigned_to_id: '', status: 'TODO', priority: 'MEDIUM', due_date: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title:          task.title,
        description:    task.description || '',
        project:        task.project,
        assigned_to_id: task.assigned_to?.id || '',
        status:         task.status,
        priority:       task.priority,
        due_date:       task.due_date || '',
      });
    } else {
      setForm(blank);
    }
    setError('');
  }, [task, isOpen]);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.assigned_to_id) delete payload.assigned_to_id;
      if (!payload.due_date) delete payload.due_date;
      await onSave(payload);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === 'object' ? Object.values(data).flat().join('. ') : 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} id="close-task-modal">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input id="task-title-input" type="text" value={form.title} onChange={f('title')} placeholder="What needs to be done?" required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea id="task-desc-input" rows={2} value={form.description} onChange={f('description')} placeholder="Additional details..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Project *</label>
                <select id="task-project-select" value={form.project} onChange={f('project')} required>
                  <option value="">Select project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select id="task-assign-select" value={form.assigned_to_id} onChange={f('assigned_to_id')}>
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select id="task-status-select" value={form.status} onChange={f('status')}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select id="task-priority-select" value={form.priority} onChange={f('priority')}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input id="task-due-input" type="date" value={form.due_date} onChange={f('due_date')} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="save-task-btn" disabled={saving}>
              {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Inline status selector ─────────────────── */
function StatusSelect({ task, onStatusChange, canEdit }) {
  const [busy, setBusy] = useState(false);

  if (!canEdit) {
    // Read-only badge for members on tasks not assigned to them
    return (
      <span className={`badge ${STATUS_CLS[task.status]}`}>
        {STATUS_LABEL[task.status]}
      </span>
    );
  }

  const handleChange = async (e) => {
    setBusy(true);
    try { await onStatusChange(task.id, e.target.value); }
    finally { setBusy(false); }
  };

  return (
    <span className={`badge ${STATUS_CLS[task.status]}`} style={{ cursor: 'pointer' }}>
      <select
        className="status-select"
        value={task.status}
        onChange={handleChange}
        disabled={busy}
        id={`status-select-${task.id}`}
      >
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </select>
    </span>
  );
}

/* ── Main Page ──────────────────────────────── */
export default function TasksPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', project: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    const params = {};
    if (filters.status)  params.status  = filters.status;
    if (filters.project) params.project = filters.project;
    if (filters.search)  params.search  = filters.search;
    try {
      const res = await tasksApi.list(params);
      setTasks(res.data.results || res.data);
    } catch {
      setError('Failed to load tasks.');
    }
  }, [filters]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchTasks();
      try { const r = await projectsApi.list(); setProjects(r.data.results || r.data); } catch {}
      if (isAdmin) {
        try { const r = await authApi.listUsers(); setUsers(r.data.results || r.data); } catch {}
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => { fetchTasks(); }, [filters, fetchTasks]);

  const handleCreate = async (form) => { await tasksApi.create(form); await fetchTasks(); };
  const handleEdit   = async (form) => { await tasksApi.update(editTask.id, form); await fetchTasks(); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    await tasksApi.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = async (id, status) => {
    await tasksApi.updateStatus(id, status);
    setTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, status, is_overdue: t.is_overdue && status !== 'DONE' } : t)
    );
  };

  const openCreate = () => { setEditTask(null); setModalOpen(true); };
  const openEdit   = (task) => { setEditTask(task); setModalOpen(true); };

  // Members can change status only on tasks assigned to them
  const canChangeStatus = (task) => isAdmin || task.assigned_to?.id === user?.id;

  return (
    <AppLayout
      title="Tasks"
      actions={
        isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={openCreate} id="create-task-btn">
            + New task
          </button>
        )
      }
    >
      {/* Filters */}
      <div className="filters-bar" id="tasks-filters">
        <input
          type="text"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          id="task-search"
          style={{ minWidth: 210 }}
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} id="filter-status">
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })} id="filter-project">
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(filters.status || filters.project || filters.search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', project: '', search: '' })} id="clear-filters">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No tasks found</div>
          <div className="empty-desc">
            {filters.status || filters.project || filters.search ? 'Try adjusting your filters.' : 'Create your first task to get started.'}
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table id="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assigned to</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} id={`task-row-${task.id}`}>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description}
                      </div>
                    )}
                  </td>

                  <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{task.project_name}</td>

                  <td style={{ fontSize: 12.5 }}>
                    {task.assigned_to
                      ? task.assigned_to.full_name || task.assigned_to.email
                      : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                      {task.is_overdue && task.status !== 'DONE' && (
                        <span className="badge badge-overdue">Overdue</span>
                      )}
                      <StatusSelect
                        task={task}
                        onStatusChange={handleStatusChange}
                        canEdit={canChangeStatus(task)}
                      />
                    </div>
                  </td>

                  <td>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  </td>

                  <td style={{ fontSize: 12.5, color: task.is_overdue && task.status !== 'DONE' ? 'var(--red)' : 'var(--text-2)' }}>
                    {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {/* Edit: admin only */}
                      {isAdmin && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(task)}
                          id={`edit-task-${task.id}`}
                          title="Edit task"
                        >
                          Edit
                        </button>
                      )}
                      {/* Delete: admin only */}
                      {isAdmin && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(task.id)}
                          id={`delete-task-${task.id}`}
                          title="Delete task"
                          style={{ color: 'var(--red)' }}
                        >
                          Delete
                        </button>
                      )}
                      {/* Members with no permissions see nothing in actions */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <TaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={editTask ? handleEdit : handleCreate}
          task={editTask}
          projects={projects}
          users={users}
        />
      )}
    </AppLayout>
  );
}
