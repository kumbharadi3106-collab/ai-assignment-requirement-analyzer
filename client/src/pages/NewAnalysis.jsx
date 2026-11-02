import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Upload, X, Loader, ChevronRight,
  AlertCircle, RotateCcw, File, Sparkles, CheckCircle2
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
    <div style={{ maxWidth: 820 }}>
      {/* Mode tabs */}
      <div className="tab-bar">
        <div
          className={`tab-item${mode === 'text' ? ' active' : ''}`}
          onClick={() => { setMode('text'); setError('') }}
        >
          <FileText size={15} style={{ display: 'inline', marginRight: 6 }} />
          Paste Text
        </div>
        <div
          className={`tab-item${mode === 'upload' ? ' active' : ''}`}
          onClick={() => { setMode('upload'); setError('') }}
        >
          <Upload size={15} style={{ display: 'inline', marginRight: 6 }} />
          Upload PDF
        </div>
      </div>

      <div className="card">
        {/* Assignment Title */}
        <div className="form-group">
          <label className="form-label">Assignment Title</label>
          <input
            className="form-input"
            placeholder="e.g. Web Development Project, Research Paper on AI Ethics…"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {text.length.toLocaleString()} / 50,000 characters
              </span>
              {text && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, padding: '3px 9px' }}
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
                  <Upload size={24} />
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15, color: 'var(--text-primary)' }}>
                  Drag & drop your assignment PDF here
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                  or click anywhere to browse from your device
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                >
                  Browse PDF Files
                </button>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>
                  Text-based PDF only · Up to 10MB
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
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                border: '1px solid var(--border-glass)', borderRadius: 'var(--radius)',
                background: 'var(--bg-subtle)'
              }}>
                <div style={{ width: 44, height: 44, background: 'var(--primary-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <File size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {(file.size / 1024).toFixed(1)} KB · PDF Document Ready
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setFile(null)} disabled={loading} title="Remove file">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 18 }}>
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {loading && (
          <div style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-glow)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            animation: 'fadeIn 0.3s ease'
          }}>
            <Loader size={20} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Analyzing Assignment with AI…</span>
                <Sparkles size={14} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{loadingMsg}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
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

      {/* Glass Tips Card */}
      <div className="card" style={{ marginTop: 22, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, color: 'var(--primary)', marginBottom: 8 }}>
          <Sparkles size={16} />
          <span>Tips for highest accuracy:</span>
        </div>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
          <li>Paste the <strong>complete</strong> assignment brief, including grading rubrics and word/page constraints.</li>
          <li>The AI engine automatically identifies conflicting submission dates and ambiguous instructions.</li>
          <li>For PDFs, ensure they are text-based rather than scanned photo images.</li>
        </ul>
      </div>
    </div>
  )
}
