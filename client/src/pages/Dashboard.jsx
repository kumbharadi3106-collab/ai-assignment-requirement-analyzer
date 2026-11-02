import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, CheckSquare, Clock, TrendingUp,
  PlusCircle, ChevronRight, Calendar, AlertCircle
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

  if (loading) return <LoadingSpinner message="Loading dashboard…" />
  if (error) return <Alert type="error">{error}</Alert>

  const { stats, recentAssignments, upcomingDeadlines } = data

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Welcome */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome back! 👋</h2>
            <p style={{ opacity: 0.85, fontSize: 14, maxWidth: 480 }}>
              Paste your assignment instructions and let AI extract every requirement, deadline, and action step for you.
            </p>
          </div>
          <button
            className="btn btn-lg"
            style={{ background: 'white', color: '#6366f1', border: 'none', fontWeight: 600 }}
            onClick={() => navigate('/new-analysis')}
          >
            <PlusCircle size={18} />
            Analyze New Assignment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          label="Assignments Analyzed"
          value={stats.totalAssignments}
          icon={<BookOpen size={18} />}
          color="#6366f1"
          bg="#e0e7ff"
        />
        <StatCard
          label="Total Tasks Generated"
          value={stats.totalTasks}
          icon={<TrendingUp size={18} />}
          color="#8b5cf6"
          bg="#ede9fe"
        />
        <StatCard
          label="Tasks Completed"
          value={stats.completedTasks}
          icon={<CheckSquare size={18} />}
          color="#10b981"
          bg="#d1fae5"
        />
        <StatCard
          label="Pending Tasks"
          value={stats.pendingTasks}
          icon={<Clock size={18} />}
          color="#f59e0b"
          bg="#fef3c7"
        />
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
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
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{a.completion_percentage}%</div>
                    <div style={{ width: 60, marginTop: 4 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Upcoming Deadlines</span>
              <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No upcoming deadlines found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingDeadlines.map(a => {
                  const dl = deadlineStatus(a.deadline)
                  return (
                    <div key={a.id}
                      className="task-item"
                      style={{ cursor: 'pointer', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 12 }}
                      onClick={() => navigate(`/assignments/${a.id}`)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(a.deadline)}</div>
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
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Task Completion</span>
                <span style={{ fontWeight: 600 }}>{stats.completionRate}%</span>
              </div>
              <div className="progress-bar" style={{ height: 10 }}>
                <div className="progress-bar-fill" style={{ width: `${stats.completionRate}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{stats.completedTasks} completed</span>
              <span>{stats.pendingTasks} remaining</span>
            </div>
            {stats.totalTasks === 0 && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <AlertCircle size={13} />
                Analyze an assignment to generate tasks.
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
