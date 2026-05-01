import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { dashboardApi } from '../api';
import { useAuth } from '../context/AuthContext';

const STAT_ICON_CLS = { primary: 'primary', success: 'success', warning: 'warning', danger: 'danger', info: 'info' };

function StatCard({ label, value, color, icon }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${STAT_ICON_CLS[color]}`}>{icon}</div>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const STATUS_CLS   = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in_progress', DONE: 'badge-done' };
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

function StatusBadge({ status, isOverdue }) {
  if (isOverdue && status !== 'DONE') return <span className="badge badge-overdue">Overdue</span>;
  return <span className={`badge ${STATUS_CLS[status] || 'badge-todo'}`}>{STATUS_LABEL[status] || status}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.get()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Dashboard"><div className="loading-center"><div className="spinner" /></div></AppLayout>;
  if (error)   return <AppLayout title="Dashboard"><div className="alert alert-error">{error}</div></AppLayout>;

  const { stats, my_tasks } = data;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <AppLayout title="Dashboard">
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 3 }}>{greeting}, {firstName}</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Here's an overview of your team's work.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" id="dashboard-stats">
        <StatCard label="Total tasks"   value={stats.total_tasks}       color="primary" icon="📋" />
        <StatCard label="Completed"     value={stats.completed_tasks}   color="success" icon="✓" />
        <StatCard label="In progress"   value={stats.in_progress_tasks} color="info"    icon="↻" />
        <StatCard label="To do"         value={stats.todo_tasks}        color="warning" icon="○" />
        <StatCard label="Overdue"       value={stats.overdue_tasks}     color="danger"  icon="!" />
        <StatCard label="Projects"      value={stats.total_projects}    color="primary" icon="▤" />
      </div>

      {/* My tasks */}
      <div className="section-header">
        <h3>My tasks</h3>
        <Link to="/tasks" className="btn btn-ghost btn-sm" id="view-all-tasks">View all</Link>
      </div>

      {my_tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <div className="empty-title">All caught up</div>
          <div className="empty-desc">No tasks assigned to you right now.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table id="my-tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due date</th>
              </tr>
            </thead>
            <tbody>
              {my_tasks.map((task) => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 500 }}>{task.title}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{task.project_name}</td>
                  <td><StatusBadge status={task.status} isOverdue={task.is_overdue} /></td>
                  <td><span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                  <td style={{ fontSize: 12.5, color: task.is_overdue && task.status !== 'DONE' ? 'var(--red)' : 'var(--text-2)' }}>
                    {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
