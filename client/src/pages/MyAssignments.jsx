import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ExternalLink, Trash2, BookOpen,
  Calendar, ChevronRight, Filter
} from 'lucide-react'
import { assignmentsAPI } from '../services/api'
import { formatDate, deadlineStatus, timeAgo, truncate } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import ConfirmModal from '../components/ConfirmModal'

export default function MyAssignments() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    assignmentsAPI.getAll()
      .then(res => setAssignments(res.assignments))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    try {
      await assignmentsAPI.delete(id)
      setAssignments(prev => prev.filter(a => a.id !== id))
      setDeleteTarget(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const filtered = assignments
    .filter(a => {
      const matchSearch = !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.subject && a.subject.toLowerCase().includes(search.toLowerCase()))
      const matchFilter = filter === 'all' ||
        (filter === 'completed' && a.completion_percentage === 100) ||
        (filter === 'in-progress' && a.completion_percentage > 0 && a.completion_percentage < 100) ||
        (filter === 'not-started' && a.completion_percentage === 0)
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sort === 'completion') return b.completion_percentage - a.completion_percentage
      if (sort === 'deadline') {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline) - new Date(b.deadline)
      }
      return 0
    })

  if (loading) return <LoadingSpinner message="Loading assignments…" />
  if (error) return <Alert type="error">{error}</Alert>

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <Search size={14} />
          <input
            className="form-input search-input"
            placeholder="Search by title or subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input form-select" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="form-input form-select" style={{ width: 150 }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="completion">By Completion</option>
          <option value="deadline">By Deadline</option>
        </select>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
        <span>{assignments.length} total assignments</span>
        <span>·</span>
        <span>{filtered.length} shown</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={24} /></div>
          <div className="empty-state-title">{search || filter !== 'all' ? 'No matches found' : 'No assignments yet'}</div>
          <div className="empty-state-desc">
            {search || filter !== 'all'
              ? 'Try a different search or filter.'
              : 'Analyze your first assignment to see it here.'}
          </div>
          {!search && filter === 'all' && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/new-analysis')}>
              Analyze Assignment
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(a => {
            const dl = deadlineStatus(a.deadline)
            return (
              <div
                key={a.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'box-shadow 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 44, height: 44, background: 'var(--primary-light)', borderRadius: 'var(--radius)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0
                  }}>
                    <BookOpen size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate(`/assignments/${a.id}`)}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{a.title}</span>
                      {a.subject && <span className="badge badge-primary" style={{ fontSize: 11 }}>{a.subject}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12.5, color: 'var(--text-muted)', flexWrap: 'wrap', marginBottom: 10 }}>
                      <span>📅 {timeAgo(a.created_at)}</span>
                      <span>📋 {a.task_count} tasks</span>
                      <span>📦 {a.requirement_count} deliverables</span>
                      {a.deadline && (
                        <span style={{ color: dl.color === 'danger' ? 'var(--danger)' : 'inherit' }}>
                          ⏰ {dl.label}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="progress-bar" style={{ flex: 1, maxWidth: 200 }}>
                        <div className="progress-bar-fill" style={{ width: `${a.completion_percentage}%` }} />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>
                        {a.completion_percentage}%
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/assignments/${a.id}`)}
                    >
                      <ExternalLink size={13} /> Open
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(a) }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Assignment"
          message={`Delete "${deleteTarget.title}"? All tasks will also be deleted. This cannot be undone.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

