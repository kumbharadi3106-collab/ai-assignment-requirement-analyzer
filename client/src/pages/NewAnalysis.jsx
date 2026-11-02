import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Upload, X, Loader, ChevronRight,
  AlertCircle, RotateCcw, File
} from 'lucide-react'
import { assignmentsAPI, uploadAPI } from '../services/api'
import Alert from '../components/Alert'

const LOADING_MESSAGES = [
  'Reading assignment instructions…',
  'Identifying deliverables…',
  'Extracting deadlines…',
  'Analyzing requirements…',
  'Detecting constraints…',
  'Organizing requirements…',
  'Preparing your action plan…',
  'Almost done…',
]

export default function NewAnalysis() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('text') // 'text' | 'upload'
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])
  const [error, setError] = useState('')
  const fileInputRef = useRef()
  const msgIntervalRef = useRef()

  function startLoadingMessages() {
    let idx = 0
    msgIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[idx])
    }, 2000)
  }

  function stopLoadingMessages() {
    clearInterval(msgIntervalRef.current)
  }

  function handleFileSelect(f) {
    if (!f) return
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.')
      return
    }
    setFile(f)
    setError('')
    if (!title) setTitle(f.name.replace('.pdf', ''))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  async function handleSubmit() {
    if (loading) return
    setError('')

    if (mode === 'text') {
      if (!text.trim()) { setError('Please paste your assignment instructions.'); return }
      if (text.trim().length < 20) { setError('Assignment text is too short.'); return }
    } else {
      if (!file) { setError('Please select a PDF file.'); return }
    }

    setLoading(true)
    setLoadingMsg(LOADING_MESSAGES[0])
    startLoadingMessages()

    try {
      let result
      if (mode === 'text') {
        result = await assignmentsAPI.analyze(title || 'Untitled Assignment', text)
      } else {
        const form = new FormData()
        form.append('pdf', file)
        form.append('title', title || file.name.replace('.pdf', ''))
        result = await uploadAPI.uploadPDF(form)
      }
      navigate(`/assignments/${result.assignment.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      stopLoadingMessages()
      setLoading(false)
    }
  }

  function handleReset() {
    setTitle('')
    setText('')
    setFile(null)
    setError('')
  }

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Mode tabs */}
      <div className="tab-bar">
        <div
          className={`tab-item${mode === 'text' ? ' active' : ''}`}
          onClick={() => { setMode('text'); setError('') }}
        >
          <FileText size={14} style={{ display: 'inline', marginRight: 6 }} />
          Paste Text
        </div>
        <div
          className={`tab-item${mode === 'upload' ? ' active' : ''}`}
          onClick={() => { setMode('upload'); setError('') }}
        >
          <Upload size={14} style={{ display: 'inline', marginRight: 6 }} />
          Upload PDF
        </div>
      </div>

      <div className="card">
        {/* Assignment Title */}
        <div className="form-group">
          <label className="form-label">Assignment Title</label>
          <input
            className="form-input"
            placeholder="e.g. Web Development Project, Research Paper on AI…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        {mode === 'text' ? (
          <div className="form-group">
            <label className="form-label">
              Assignment Instructions
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                (paste the complete assignment brief)
              </span>
            </label>
            <textarea
              className="form-input form-textarea"
              style={{ minHeight: 280 }}
              placeholder="Paste your full assignment instructions here. Include all requirements, deliverables, deadlines, constraints, and submission details…"
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={loading}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {text.length} / 50,000 characters
              </span>
              {text && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, padding: '2px 8px' }}
                  onClick={() => setText('')}
                >
                  <RotateCcw size={11} /> Clear text
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Upload Assignment PDF</label>
            {!file ? (
              <div
                className={`upload-area${dragOver ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-area-icon">
                  <Upload size={22} />
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                  Drag & drop your PDF here
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
                  or click to browse files
                </div>
                <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                  Browse Files
                </button>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                  PDF only · Max 10MB
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => handleFileSelect(e.target.files[0])}
                />
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                background: 'var(--bg)'
              }}>
                <div style={{ width: 40, height: 40, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <File size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {(file.size / 1024).toFixed(1)} KB · PDF
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setFile(null)} disabled={loading}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {loading && (
          <div style={{
            background: 'var(--primary-light)', borderRadius: 'var(--radius)',
            padding: '14px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <Loader size={18} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--primary)' }}>Analyzing with Claude AI…</div>
              <div style={{ fontSize: 12.5, color: 'var(--primary)', opacity: 0.8 }}>{loadingMsg}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
            <RotateCcw size={14} /> Reset
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</>
            ) : (
              <>Analyze Assignment <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--primary-light)', borderRadius: 'var(--radius)', fontSize: 13 }}>
        <strong style={{ color: 'var(--primary)' }}>💡 Tips for best results:</strong>
        <ul style={{ marginTop: 6, paddingLeft: 18, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <li>Paste the <strong>complete</strong> assignment brief, not just a summary</li>
          <li>Include all requirements, deadlines, constraints and submission rules</li>
          <li>The more complete your input, the better the analysis</li>
        </ul>
      </div>
    </div>
  )
}

