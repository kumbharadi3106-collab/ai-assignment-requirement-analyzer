import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, CheckSquare, Clock, TrendingUp,
  PlusCircle, ChevronRight, Calendar, AlertCircle, Sparkles
} from 'lucide-react'
import { dashboardAPI } from '../services/api'
import { formatDate, deadlineStatus, timeAgo } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard intelligence…" />
  if (error) return <Alert type="error">{error}</Alert>

  const { stats, recentAssignments, upcomingDeadlines } = data

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* iOS Liquid Glass Hero Banner */}
      <div
        className="card"
        style={{
          marginBottom: 26,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.88) 0%, rgba(139, 92, 246, 0.88) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          boxShadow: '0 12px 36px -6px rgba(99, 102, 241, 0.35)',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ zIndex: 1, maxWidth: 540 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <Sparkles size={13} />
              <span>Intelligent Student Productivity</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Welcome back! 👋
            </h2>
            <p style={{ opacity: 0.9, fontSize: 14.5, lineHeight: 1.6 }}>
              Paste your assignment brief or upload a PDF. Claude & Gemini will instantly extract every requirement, restriction, and deadline into an organized action plan.
            </p>
          </div>
          <button
            className="btn btn-lg"
            style={{
              background: '#ffffff',
              color: '#4f46e5',
              border: 'none',
              fontWeight: 700,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              zIndex: 1
            }}
            onClick={() => navigate('/new-analysis')}
          >
            <PlusCircle size={18} />
            Analyze New Assignment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-4" style={{ marginBottom: 26 }}>
        <StatCard
          label="Assignments Analyzed"
          value={stats.totalAssignments}
          icon={<BookOpen size={19} />}
          color="var(--primary)"
          bg="var(--primary-light)"
        />
        <StatCard
          label="Total Tasks Generated"
          value={stats.totalTasks}
          icon={<TrendingUp size={19} />}
          color="var(--secondary)"
          bg="var(--secondary-glow)"
        />
        <StatCard
          label="Tasks Completed"
          value={stats.completedTasks}
          icon={<CheckSquare size={19} />}
          color="var(--success)"
          bg="var(--success-light)"
        />
        <StatCard
          label="Pending Tasks"
          value={stats.pendingTasks}
          icon={<Clock size={19} />}
          color="var(--warning)"
          bg="var(--warning-light)"
        />
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Recent Assignments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Assignments</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/assignments')}>
              View all <ChevronRight size={14} />
            </button>
          </div>

          {recentAssignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><BookOpen size={24} /></div>
              <div className="empty-state-title">No assignments yet</div>
              <div className="empty-state-desc">Analyze your first assignment to get started.</div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/new-analysis')}>
                <PlusCircle size={14} /> Analyze Assignment
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentAssignments.map(a => (
                <div
                  key={a.id}
                  className="task-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/assignments/${a.id}`)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.title}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>{timeAgo(a.created_at)}</span>
                      <span>·</span>
                      <span>{a.task_count} tasks</span>
                      {a.subject && <><span>·</span><span>{a.subject}</span></>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{a.completion_percentage}%</div>
                    <div style={{ width: 64, marginTop: 5 }}>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${a.completion_percentage}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines + Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Upcoming Deadlines</span>
              <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
                No upcoming deadlines on schedule.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingDeadlines.map(a => {
                  const dl = deadlineStatus(a.deadline)
                  return (
                    <div
                      key={a.id}
                      className="task-item"
                      style={{ cursor: 'pointer', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 12 }}
                      onClick={() => navigate(`/assignments/${a.id}`)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(a.deadline)}</div>
                      </div>
                      <span className={`badge badge-${dl.color}`}>{dl.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Progress overview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Overall Progress</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Task Completion</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{stats.completionRate}%</span>
              </div>
              <div className="progress-bar" style={{ height: 9 }}>
                <div className="progress-bar-fill" style={{ width: `${stats.completionRate}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)' }}>
              <span>✅ {stats.completedTasks} completed</span>
              <span>⏳ {stats.pendingTasks} remaining</span>
            </div>
            {stats.totalTasks === 0 && (
              <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <AlertCircle size={14} />
                Analyze an assignment to generate actionable checklist tasks.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ background: bg, color }}>
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
    </div>
  )
}
