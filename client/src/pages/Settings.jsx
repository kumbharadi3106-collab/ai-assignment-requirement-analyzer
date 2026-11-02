import { useState, useEffect } from 'react'
import { Key, Server, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { healthAPI } from '../services/api'
import Alert from '../components/Alert'

export default function Settings() {
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    healthAPI.check()
      .then(res => setHealth(res))
      .catch(() => setHealth({ status: 'error' }))
      .finally(() => setHealthLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 680 }}>
      {/* API Status */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
          <Server size={15} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />
          System Status
        </h3>

        {healthLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Checking server…</div>
        ) : health?.status === 'ok' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StatusRow
              label="Backend Server"
              value="Running"
              ok
            />
            <StatusRow
              label="Anthropic API Key"
              value={health.apiKeyConfigured ? 'Configured ✓' : 'Not configured ✗'}
              ok={health.apiKeyConfigured}
            />
            <StatusRow
              label="Claude Model"
              value={health.model || 'Not set'}
              ok={!!health.model}
            />
            <StatusRow
              label="Database"
              value="SQLite — Connected"
              ok
            />
          </div>
        ) : (
          <Alert type="error">Cannot reach backend server. Make sure the server is running on port 5000.</Alert>
        )}
      </div>

      {/* API Key Setup */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
          <Key size={15} style={{ display: 'inline', marginRight: 6, color: 'var(--primary)' }} />
          Anthropic API Key Setup
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          The API key is stored securely on the server only, never in the browser.
        </p>
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: 6, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 12 }}># server/.env</div>
          <div><span style={{ color: 'var(--primary)' }}>ANTHROPIC_API_KEY</span>=sk-ant-your-key-here</div>
          <div><span style={{ color: 'var(--primary)' }}>ANTHROPIC_MODEL</span>=claude-3-5-sonnet-20241022</div>
          <div><span style={{ color: 'var(--primary)' }}>PORT</span>=5000</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <Alert type="info">
            Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>console.anthropic.com</a>. After adding it to the .env file, restart the server.
          </Alert>
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>📋 Setup Instructions</h3>
        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            <>Copy <code style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>server/.env.example</code> to <code style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>server/.env</code></>,
            <>Add your Anthropic API key to the <code style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>.env</code> file</>,
            <>Start the backend: <code style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>cd server && npm start</code></>,
            <>Start the frontend: <code style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>cd client && npm run dev</code></>,
            'Go to New Analysis and paste an assignment to test the full workflow',
          ].map((step, i) => (
            <li key={i} style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function StatusRow({ label, value, ok }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
      <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {ok
          ? <CheckCircle size={14} style={{ color: 'var(--success)' }} />
          : <AlertCircle size={14} style={{ color: 'var(--danger)' }} />}
        <span style={{ fontSize: 13, fontWeight: 500, color: ok ? 'var(--success)' : 'var(--danger)' }}>{value}</span>
      </div>
    </div>
  )
}

