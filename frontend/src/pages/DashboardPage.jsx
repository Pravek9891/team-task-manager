import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { dashboardApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`stat-card ${color}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function StatusBadge({ status, isOverdue }) {
  if (isOverdue) return <span className="badge badge-overdue">Overdue</span>;
  const cls = {
    TODO: 'badge-todo',
    IN_PROGRESS: 'badge-in_progress',
    DONE: 'badge-done',
  }[status] || 'badge-todo';
  const label = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  }[status] || status;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.get()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="loading-center"><div className="spinner" /></div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Dashboard">
        <div className="alert alert-error">{error}</div>
      </AppLayout>
    );
  }

  const { stats, my_tasks } = data;

  return (
    <AppLayout title="Dashboard">
      {/* Greeting */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>
          Good {getTimeOfDay()}, {user?.full_name?.split(' ')[0] || 'there'} 👋
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Here's what's happening with your team today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" id="dashboard-stats">
        <StatCard label="Total Tasks" value={stats.total_tasks} color="primary" icon="📋" />
        <StatCard label="Completed" value={stats.completed_tasks} color="success" icon="✅" />
        <StatCard label="In Progress" value={stats.in_progress_tasks} color="info" icon="🔄" />
        <StatCard label="To Do" value={stats.todo_tasks} color="warning" icon="📌" />
        <StatCard label="Overdue" value={stats.overdue_tasks} color="danger" icon="⚠️" />
        <StatCard label="Projects" value={stats.total_projects} color="primary" icon="📁" />
      </div>

      {/* My Tasks */}
      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>My Assigned Tasks</h3>
        <Link to="/tasks" className="btn btn-ghost btn-sm" id="view-all-tasks">View all →</Link>
      </div>

      {my_tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <div className="empty-text">You're all caught up!</div>
          <div className="empty-sub">No tasks assigned to you right now.</div>
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
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {my_tasks.map((task) => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 500 }}>{task.title}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{task.project_name}</td>
                  <td><StatusBadge status={task.status} isOverdue={task.is_overdue} /></td>
                  <td>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td style={{ color: task.is_overdue ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
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

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
