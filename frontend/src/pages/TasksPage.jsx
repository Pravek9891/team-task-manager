import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { tasksApi, projectsApi, authApi } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const STATUS_COLORS = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in_progress', DONE: 'badge-done' };

function TaskModal({ isOpen, onClose, onSave, task, projects, users }) {
  const defaultForm = {
    title: '',
    description: '',
    project: '',
    assigned_to_id: '',
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: '',
  };

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        project: task.project,
        assigned_to_id: task.assigned_to?.id || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
      });
    } else {
      setForm(defaultForm);
    }
    setError('');
  }, [task, isOpen]);

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
      if (typeof data === 'object') {
        const msgs = Object.values(data).flat().join('. ');
        setError(msgs);
      } else {
        setError('Failed to save task.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'Create Task'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} id="close-task-modal">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                id="task-title-input"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                id="task-desc-input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What needs to be done?"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Project *</label>
                <select
                  id="task-project-select"
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  required
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select
                  id="task-assign-select"
                  value={form.assigned_to_id}
                  onChange={(e) => setForm({ ...form, assigned_to_id: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  id="task-status-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  id="task-priority-select"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  id="task-due-input"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="save-task-btn" disabled={saving}>
              {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusDropdown({ task, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (e) => {
    setUpdating(true);
    try {
      await onStatusChange(task.id, e.target.value);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <select
      value={task.status}
      onChange={handleChange}
      disabled={updating}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 0,
        color: 'inherit',
        fontSize: 'inherit',
        width: 'auto',
      }}
      id={`status-select-${task.id}`}
    >
      <option value="TODO">To Do</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="DONE">Done</option>
    </select>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
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
    if (filters.status) params.status = filters.status;
    if (filters.project) params.project = filters.project;
    if (filters.search) params.search = filters.search;
    try {
      const res = await tasksApi.list(params);
      setTasks(res.data.results || res.data);
    } catch {
      setError('Failed to load tasks.');
    }
  }, [filters]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchTasks();
      try {
        const pRes = await projectsApi.list();
        setProjects(pRes.data.results || pRes.data);
      } catch {}
      if (user?.role === 'ADMIN') {
        try {
          const uRes = await authApi.listUsers();
          setUsers(uRes.data.results || uRes.data);
        } catch {}
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters, fetchTasks]);

  const handleCreate = async (form) => {
    await tasksApi.create(form);
    await fetchTasks();
  };

  const handleEdit = async (form) => {
    await tasksApi.update(editTask.id, form);
    await fetchTasks();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    await tasksApi.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = async (id, status) => {
    await tasksApi.updateStatus(id, status);
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status, is_overdue: t.is_overdue && status !== 'DONE' } : t));
  };

  const openCreate = () => {
    setEditTask(null);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  return (
    <AppLayout
      title="Tasks"
      actions={
        <button className="btn btn-primary" onClick={openCreate} id="create-task-btn">
          + New Task
        </button>
      }
    >
      {/* Filters */}
      <div className="filters-bar" id="tasks-filters">
        <input
          type="text"
          placeholder="🔍 Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          id="task-search"
          style={{ minWidth: 220 }}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          id="filter-status"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select
          value={filters.project}
          onChange={(e) => setFilters({ ...filters, project: e.target.value })}
          id="filter-project"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {(filters.status || filters.project || filters.search) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ status: '', project: '', search: '' })}
            id="clear-filters"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-text">No tasks found</div>
          <div className="empty-sub">Create your first task or adjust the filters.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table id="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} id={`task-row-${task.id}`}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{task.project_name}</td>
                  <td>
                    {task.assigned_to
                      ? <span>{task.assigned_to.full_name || task.assigned_to.email}</span>
                      : <span style={{ color: 'var(--color-text-dim)' }}>—</span>}
                  </td>
                  <td>
                    {task.is_overdue && task.status !== 'DONE' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="badge badge-overdue">Overdue</span>
                        <span className={`badge ${STATUS_COLORS[task.status]}`} style={{ fontSize: '10px' }}>
                          <StatusDropdown task={task} onStatusChange={handleStatusChange} />
                        </span>
                      </div>
                    ) : (
                      <span className={`badge ${STATUS_COLORS[task.status]}`}>
                        <StatusDropdown task={task} onStatusChange={handleStatusChange} />
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  </td>
                  <td style={{ color: task.is_overdue && task.status !== 'DONE' ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)} id={`edit-task-${task.id}`}>✏️</button>
                      {user?.role === 'ADMIN' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(task.id)} id={`delete-task-${task.id}`}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={editTask ? handleEdit : handleCreate}
        task={editTask}
        projects={projects}
        users={users}
      />
    </AppLayout>
  );
}
