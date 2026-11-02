import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, FolderOpen, CheckSquare,
  Info, Settings, Brain
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-analysis', icon: PlusCircle, label: 'New Analysis' },
  { to: '/assignments', icon: FolderOpen, label: 'My Assignments' },
  { to: '/tasks', icon: CheckSquare, label: 'Task Manager' },
]

const bottomNavItems = [
  { to: '/about', icon: Info, label: 'About Project' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/new-analysis': 'New Analysis',
  '/assignments': 'My Assignments',
  '/tasks': 'Task Manager',
  '/about': 'About Project',
  '/settings': 'Settings',
}

export default function Layout() {
  const location = useLocation()
  const currentTitle = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'Assignment Analyzer'

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Brain size={18} />
          </div>
          <div>
            <div className="sidebar-logo-text">AI Analyzer</div>
            <div className="sidebar-logo-sub">Assignment Assistant</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 16 }}>More</div>
          {bottomNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Powered by Claude AI<br />
            <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Anthropic</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="page-header">
          <h1 className="page-header-title">{currentTitle}</h1>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

