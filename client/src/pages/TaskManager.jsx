import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckSquare, Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { tasksAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'

const TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'high', label: 'High Priority' },
]

export default function TaskManager() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    tasksAPI.getAll()
      .then(res => setTasks(res.tasks))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(task) {
    setUpdating(task.id)
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      await tasksAPI.update(task.id, { status: newStatus })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = tasks
    .filter(t => {
      const matchSearch = !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.assignment_title && t.assignment_title.toLowerCase().includes(search.toLowerCase()))
      const matchTab =
        tab === 'all' ||
        (tab === 'pending' && t.status === 'pending') ||
        (tab === 'completed' && t.status === 'completed') ||
        (tab === 'high' && t.priority === 'high')
      return matchSearch && matchTab
    })

  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const highCount = tasks.filter(t => t.priority === 'high').length

  if (loading) return <LoadingSpinner message="Loading tasks…" />
  if (error) return <Alert type="error">{error}</Alert>

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Summary row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <MiniStat label="Pending" value={pendingCount} color="var(--warning)" />
        <MiniStat label="Completed" value={completedCount} color="var(--success)" />
        <MiniStat label="High Priority" value={highCount} color="var(--danger)" />
      </div>

      {/* Search */}
      <div className="search-wrap" style={{ marginBottom: 16 }}>
        <Search size={14} />
        <input
          className="form-input search-input"
          placeholder="Search tasks or assignments…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(t => (
          <div key={t.key} className={`tab-item${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === 'pending' && pendingCount > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--warning)', color: 'white', borderRadius: 100, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckSquare size={24} /></div>
          <div className="empty-state-title">No tasks found</div>
          <div className="empty-state-desc">
            {tasks.length === 0
              ? 'Analyze an assignment to generate tasks automatically.'
              : 'No tasks match your current filter.'}
          </div>
          {tasks.length === 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/new-analysis')}>
              Analyze Assignment
            </button>
          )}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
            {filtered.length} task{filtered.length !== 1 ? 's' : ''} shown
          </div>
          {filtered.map(task => (
            <div
              key={task.id}
              className={`task-item${task.status === 'completed' ? ' completed' : ''}`}
              onClick={() => handleToggle(task)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ paddingTop: 2, flexShrink: 0 }}>
                {updating === task.id ? (
                  <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => {}}
                    style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="task-title">{task.title}</div>
                {task.description && <div className="task-desc">{task.description}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${task.priority === 'high' ? 'high' : task.priority === 'low' ? 'low' : 'medium'}`} style={{ fontSize: 11 }}>
                    {task.priority}
                  </span>
                  {task.stage && <span className="badge badge-neutral" style={{ fontSize: 11 }}>{task.stage}</span>}
                  {task.status === 'completed' && <span className="badge badge-success" style={{ fontSize: 11 }}>✓ done</span>}
                </div>
              </div>
              {task.assignment_title && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flexShrink: 0, fontSize: 12 }}
                  onClick={e => { e.stopPropagation(); navigate(`/assignments/${task.assignment_id}`) }}
                >
                  <ExternalLink size={12} />
                  {task.assignment_title.length > 20 ? task.assignment_title.slice(0, 20) + '…' : task.assignment_title}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

