import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Download, Trash2, ArrowLeft,
  BookOpen, Package, ClipboardList, AlertTriangle, Calendar,
  Send, BarChart2, Lightbulb, CheckSquare, AlertCircle,
  ExternalLink, Flag
} from 'lucide-react'
import { assignmentsAPI, tasksAPI } from '../services/api'
import { formatDate, deadlineStatus, downloadBlob } from '../utils/helpers'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import ConfirmModal from '../components/ConfirmModal'

export default function AnalysisResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    assignmentsAPI.getById(id)
      .then(res => setData(res.assignment))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleTaskToggle(taskId, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    try {
      await tasksAPI.update(taskId, { status: newStatus })
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
        completion_percentage: calculateCompletion(
          prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        )
      }))
    } catch (err) {
      alert(err.message)
    }
  }

  function calculateCompletion(tasks) {
    if (!tasks.length) return 0
    return Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
  }

  async function handleExport(format) {
    setExporting(format)
    try {
      const response = await assignmentsAPI.export(id, format)
      const ext = format === 'csv' ? 'csv' : 'pdf'
      const mime = format === 'csv' ? 'text/csv' : 'application/pdf'
      downloadBlob(new Blob([response.data], { type: mime }), `assignment-${id}.${ext}`)
    } catch (err) {
      alert('Export failed: ' + err.message)
    } finally {
      setExporting('')
    }
  }

  async function handleDelete() {
    try {
      await assignmentsAPI.delete(id)
      navigate('/assignments')
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <LoadingSpinner message="Loading analysis…" />
  if (error) return <Alert type="error">{error}</Alert>
  if (!data) return null

  const { analysis, tasks } = data
  const dl = deadlineStatus(data.deadline)
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const completion = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/assignments')}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{data.title}</h2>
          <div style={{ display: 'flex', gap: 10, fontSize: 12.5, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {data.subject && <span>📚 {data.subject}</span>}
            <span>📅 Analyzed {formatDate(data.created_at)}</span>
            <span>✅ {completedCount}/{tasks.length} tasks done</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')} disabled={!!exporting}>
            <Download size={13} /> {exporting === 'csv' ? 'Exporting…' : 'CSV'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('pdf')} disabled={!!exporting}>
            <Download size={13} /> {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Completeness + progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Task Completion</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{completion}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${completion}%` }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{completedCount} of {tasks.length} tasks completed</div>
          </div>
          {analysis.completenessScore !== undefined && (
            <div style={{ textAlign: 'center', padding: '0 16px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: analysis.completenessScore >= 70 ? 'var(--success)' : analysis.completenessScore >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                {analysis.completenessScore}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Assignment Completeness</div>
            </div>
          )}
          {data.deadline && (
            <div style={{ textAlign: 'center' }}>
              <span className={`badge badge-${dl.color}`} style={{ fontSize: 13, padding: '4px 12px' }}>
                <Calendar size={12} /> {dl.label}
              </span>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{formatDate(data.deadline)}</div>
            </div>
          )}
          {analysis.hasConflicts && (
            <span className="badge badge-warning">⚠ Conflicts Detected</span>
          )}
        </div>
      </div>

      {/* Overview */}
      <Section icon={<BookOpen size={16} />} title="Assignment Overview" defaultOpen>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {analysis.assignmentOverview?.subject && <InfoRow label="Subject" value={analysis.assignmentOverview.subject} />}
          {analysis.assignmentOverview?.objective && <InfoRow label="Objective" value={analysis.assignmentOverview.objective} />}
        </div>
        {analysis.assignmentOverview?.summary && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{analysis.assignmentOverview.summary}</p>
        )}
        {analysis.assignmentOverview?.importantNotes?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>⚠ Important Notes</div>
            <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {analysis.assignmentOverview.importantNotes.map((note, i) => (
                <li key={i} style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* Deliverables */}
      <Section icon={<Package size={16} />} title={`Deliverables (${analysis.deliverables?.length || 0})`} defaultOpen>
        {!analysis.deliverables?.length
          ? <Empty text="No deliverables extracted." />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analysis.deliverables.map((d, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{i + 1}. {d.name}</span>
                    <span className={`badge ${d.mandatory ? 'badge-high' : 'badge-neutral'}`}>{d.mandatory ? 'Required' : 'Optional'}</span>
                  </div>
                  {d.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.description}</p>}
                  {d.sourceText && <SourceQuote text={d.sourceText} />}
                </div>
              ))}
            </div>
        }
      </Section>

      {/* Requirements */}
      <Section icon={<ClipboardList size={16} />} title={`Requirements (${analysis.requirements?.length || 0})`} defaultOpen>
        {!analysis.requirements?.length
          ? <Empty text="No requirements extracted." />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analysis.requirements.map((r, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', background: 'var(--bg)', display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{r.title}</span>
                      <span className={`badge badge-${r.priority === 'high' ? 'high' : r.priority === 'low' ? 'low' : 'medium'}`}>
                        {r.priority || 'medium'}
                      </span>
                    </div>
                    {r.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.description}</p>}
                    {r.sourceText && <SourceQuote text={r.sourceText} />}
                  </div>
                </div>
              ))}
            </div>
        }
      </Section>

      {/* Constraints */}
      {analysis.constraints?.length > 0 && (
        <Section icon={<Flag size={16} />} title={`Constraints (${analysis.constraints.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.constraints.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'var(--warning-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <AlertTriangle size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  {c.type && <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--warning)', textTransform: 'uppercase', marginRight: 8 }}>{c.type}</span>}
                  <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{c.description}</span>
                  {c.sourceText && <SourceQuote text={c.sourceText} />}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Deadlines */}
      <Section icon={<Calendar size={16} />} title="Deadlines" defaultOpen>
        {!analysis.deadlines?.length
          ? <div style={{ padding: '12px 16px', background: 'var(--warning-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>No deadline specified in the assignment brief.</span>
            </div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analysis.deadlines.map((d, i) => {
                const dlInfo = deadlineStatus(d.date)
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
                    <Calendar size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>{d.description}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {d.date ? <><strong>{d.date}</strong>{d.time ? ` at ${d.time}` : ''}</> : 'Date not specified'}
                      </div>
                      {d.sourceText && <SourceQuote text={d.sourceText} />}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <span className={`badge badge-${d.type === 'final' ? 'danger' : 'info'}`}>{d.type || 'deadline'}</span>
                      {d.date && <span className={`badge badge-${dlInfo.color}`}>{dlInfo.label}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </Section>

      {/* Submission */}
      {analysis.submissionRequirements?.length > 0 && (
        <Section icon={<Send size={16} />} title="Submission Requirements">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.submissionRequirements.map((s, i) => (
              <div key={i} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
                {s.aspect && <span style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: 'var(--primary)', marginRight: 8 }}>{s.aspect}</span>}
                <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{s.description}</span>
                {s.sourceText && <SourceQuote text={s.sourceText} />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Evaluation */}
      {analysis.evaluationCriteria?.length > 0 && (
        <Section icon={<BarChart2 size={16} />} title="Evaluation Criteria">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.evaluationCriteria.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{e.criterion}</span>
                    {e.weightage && <span className="badge badge-primary">{e.weightage}</span>}
                  </div>
                  {e.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.description}</p>}
                  {e.sourceText && <SourceQuote text={e.sourceText} />}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ambiguities */}
      {analysis.ambiguities?.length > 0 && (
        <Section icon={<AlertTriangle size={16} />} title={`Issues & Ambiguities (${analysis.ambiguities.length})`} defaultOpen>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.ambiguities.map((a, i) => (
              <div key={i} style={{ padding: '14px 16px', background: a.type === 'conflicting' ? 'var(--danger-light)' : 'var(--warning-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <AlertTriangle size={15} style={{ color: a.type === 'conflicting' ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{a.issue}</span>
                  <span className={`badge badge-${a.type === 'conflicting' ? 'danger' : a.type === 'missing' ? 'warning' : 'neutral'}`}>{a.type}</span>
                </div>
                {a.reason && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{a.reason}</p>}
                {a.recommendation && (
                  <p style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 500, fontStyle: 'italic' }}>
                    💡 {a.recommendation}
                  </p>
                )}
                {a.sourceText && <SourceQuote text={a.sourceText} />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action Plan */}
      {analysis.actionPlan?.length > 0 && (
        <Section icon={<Lightbulb size={16} />} title="Suggested Action Plan" defaultOpen>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {analysis.actionPlan.map((stage, si) => (
              <div key={si}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0
                  }}>{si + 1}</div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{stage.stage}</span>
                </div>
                <div style={{ paddingLeft: 34, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {stage.tasks?.map((task, ti) => (
                    <div key={ti} style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, fontSize: 13.5 }}>{task.title}</span>
                        <span className={`badge badge-${task.priority === 'high' ? 'high' : task.priority === 'low' ? 'low' : 'medium'}`}>{task.priority}</span>
                        {task.estimatedEffort && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>~{task.estimatedEffort}</span>}
                      </div>
                      {task.description && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>{task.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Task Checklist */}
      <Section icon={<CheckSquare size={16} />} title={`Task Checklist (${tasks.length})`} defaultOpen>
        {!tasks.length
          ? <Empty text="No tasks generated for this assignment." />
          : <>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
                <span>✅ {completedCount} completed</span>
                <span>·</span>
                <span>⏳ {tasks.length - completedCount} pending</span>
              </div>
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`task-item${task.status === 'completed' ? ' completed' : ''}`}
                  onClick={() => handleTaskToggle(task.id, task.status)}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => {}}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span className={`badge badge-${task.priority === 'high' ? 'high' : task.priority === 'low' ? 'low' : 'medium'}`} style={{ fontSize: 11 }}>{task.priority}</span>
                      {task.stage && <span className="badge badge-neutral" style={{ fontSize: 11 }}>{task.stage}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </>
        }
      </Section>

      {showDeleteModal && (
        <ConfirmModal
          title="Delete Assignment"
          message={`Are you sure you want to delete "${data.title}"? This will also delete all associated tasks. This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}

function Section({ icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--primary)' }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </div>
      {open && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}

function SourceQuote({ text }) {
  const [show, setShow] = useState(false)
  if (!text) return null
  return (
    <>
      <div className="collapsible-trigger" onClick={e => { e.stopPropagation(); setShow(s => !s) }}>
        <ExternalLink size={11} /> {show ? 'Hide' : 'View'} source quote
      </div>
      {show && <div className="source-quote">"{text}"</div>}
    </>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function Empty({ text }) {
  return <div style={{ fontSize: 13.5, color: 'var(--text-muted)', padding: '8px 0' }}>{text}</div>
}

