/**
 * Reusable layout for all authenticated pages.
 */
import Sidebar from './Sidebar';

export default function AppLayout({ title, children, actions }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">{title}</h1>
          {actions && <div style={{ display: 'flex', gap: 'var(--space-3)' }}>{actions}</div>}
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
