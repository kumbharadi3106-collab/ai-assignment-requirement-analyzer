import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, FolderOpen, CheckSquare,
  Info, Settings, Brain, Menu, X, Sparkles
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentTitle = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'Assignment Analyzer'

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="app-layout">
      {/* Background ambient lighting meshes for liquid glass effect */}
      <div className="ambient-mesh ambient-mesh-1" aria-hidden="true" />
      <div className="ambient-mesh ambient-mesh-2" aria-hidden="true" />

      {/* Mobile backdrop overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Brain size={19} className="logo-spark" />
          </div>
          <div>
            <div className="sidebar-logo-text">AI Analyzer</div>
            <div className="sidebar-logo-sub">Smart Requirement Assistant</div>
          </div>
          {mobileMenuOpen && (
            <button
              className="btn btn-ghost btn-icon mobile-close-btn"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobileMenu}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 20 }}>System</div>
          {bottomNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobileMenu}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Card */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
            <div className="footer-status-indicator">
              <span className="pulse-dot" />
              <span className="status-label">Claude & Gemini Ready</span>
            </div>
            <div className="footer-note">
              Liquid Glass UI v2.5
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="page-header">
          <div className="page-header-left">
            <button
              className="btn btn-ghost btn-icon mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="header-title-wrap">
              <h1 className="page-header-title">{currentTitle}</h1>
            </div>
          </div>

          <div className="page-header-actions">
            <div className="status-pill hide-mobile">
              <Sparkles size={13} className="sparkle-icon" />
              <span>AI Engine Active</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="page-content">
          <div className="page-transition-wrap">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
