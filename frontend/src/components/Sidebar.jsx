import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/projects', icon: '📁', label: 'Projects' },
  { to: '/tasks', icon: '✅', label: 'Tasks' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.full_name?.[0] || user.email[0]}`.toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div className="sidebar-logo-text">
          TaskFlow
          <span>Team Task Manager</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 'var(--space-4)' }}>Admin</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-item-icon">👥</span>
              Users
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info" onClick={handleLogout} title="Click to logout">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.full_name || user?.email}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <span style={{ color: 'var(--color-text-dim)', fontSize: '14px' }}>↗</span>
        </div>
      </div>
    </aside>
  );
}
