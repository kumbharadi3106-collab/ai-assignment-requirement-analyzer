import { Brain, Database, Cpu, Layers, Shield, BookOpen, GitBranch } from 'lucide-react'

export default function AboutProject() {
  return (
    <div style={{ maxWidth: 820 }}>
      {/* Hero */}
      <div className="card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 12px 36px -6px rgba(99, 102, 241, 0.35)',
        color: 'white',
        textAlign: 'center',
        padding: '44px 32px'
      }}>
        <div style={{ width: 68, height: 68, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
          <Brain size={32} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>AI Assignment Requirement Analyzer</h2>
        <p style={{ opacity: 0.92, fontSize: 15.5, maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
          An intelligent student productivity application designed with Apple-inspired glassmorphism that automatically extracts, organizes, and tracks every requirement from your assignment briefs.
        </p>
      </div>

      {/* Problem & Solution */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--danger)' }}>🎯 The Problem</h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Students receive lengthy assignment briefs filled with requirements, deadlines, constraints, and grading criteria. Reading through them manually is time-consuming, and it's easy to miss important instructions — leading to lost marks or late submissions.
          </p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--success)' }}>✅ The Solution</h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            This application uses Claude AI to instantly analyze assignment instructions and extract every deliverable, deadline, constraint, and evaluation criterion into an organized, actionable checklist — saving students time and preventing missed requirements.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚙️ How It Works</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { step: 1, title: 'Input', desc: 'Student pastes assignment text or uploads a PDF document.' },
            { step: 2, title: 'Validation', desc: 'Backend validates the input — rejects empty text, invalid files, or oversized documents.' },
            { step: 3, title: 'PDF Extraction', desc: 'If a PDF is uploaded, text is extracted using pdf-parse before analysis.' },
            { step: 4, title: 'Claude AI Analysis', desc: 'Assignment text is sent to Claude via the Anthropic API with a carefully engineered structured prompt.' },
            { step: 5, title: 'Response Validation', desc: 'The AI response is validated for correct JSON structure and required fields. Invalid responses are rejected safely.' },
            { step: 6, title: 'Database Storage', desc: 'Validated analysis is stored in SQLite along with generated tasks and deliverables.' },
            { step: 7, title: 'Results Display', desc: 'Results are shown in organized sections: overview, deliverables, deadlines, constraints, evaluation criteria, and an action plan.' },
            { step: 8, title: 'Task Tracking', desc: 'Generated tasks become an interactive checklist. Completion status is saved to SQLite and persists across sessions.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{step}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🛠 Technology Stack</h3>
        <div className="grid-2">
          {[
            { icon: <Layers size={16} />, title: 'Frontend', items: ['React 18 + Vite', 'React Router v6', 'Lucide React Icons', 'Axios', 'CSS3 (custom)'] },
            { icon: <Cpu size={16} />, title: 'Backend', items: ['Node.js + Express.js', 'Anthropic SDK (Claude)', 'Multer (file uploads)', 'pdf-parse', 'PDFKit + json2csv'] },
            { icon: <Database size={16} />, title: 'Database', items: ['SQLite (better-sqlite3)', 'Auto-initialized on start', 'Assignments, tasks, deliverables', 'Foreign key constraints'] },
            { icon: <Shield size={16} />, title: 'Security', items: ['API key server-side only', 'Input validation middleware', 'File type + size limits', 'Parameterized SQL queries', 'CORS configuration'] },
          ].map(({ icon, title, items }) => (
            <div key={title} style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontWeight: 600 }}>
                <span style={{ color: 'var(--primary)' }}>{icon}</span>
                {title}
              </div>
              <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {items.map(i => <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Engineering */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🧠 Prompt Engineering</h3>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
          The AI prompt is carefully designed to instruct Claude to analyze assignments in 8 structured stages: understanding the assignment, identifying deliverables, extracting requirements, finding constraints, identifying deadlines, finding evaluation criteria, detecting ambiguities, and generating an action plan.
        </p>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
          The prompt strictly instructs Claude to <strong>never invent information</strong>, to include source quotations for important extractions, to flag conflicting instructions rather than silently choosing one, and to return structured JSON output only.
        </p>
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>8 ANALYSIS STAGES</div>
          {['Understand the assignment', 'Identify objectives & deliverables', 'Extract requirements & constraints', 'Extract deadlines & submission details', 'Identify evaluation criteria', 'Detect missing or conflicting information', 'Generate actionable checklist & plan', 'Return structured JSON output'].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Responsible AI */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🛡 Responsible AI Practices</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Never invents deadlines', 'If no deadline is mentioned, displays "No deadline specified" — never fabricates a date.'],
            ['Source verification', 'Each extracted item includes the original quote from the assignment for student verification.'],
            ['Conflict detection', 'Contradictory instructions are flagged as ambiguities, not silently resolved.'],
            ['Suggestions are labelled', 'AI-generated suggestions are clearly marked to distinguish them from official requirements.'],
            ['Validation before display', 'AI responses are validated for JSON structure and required fields before being shown to users.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>⚠ Limitations</h3>
        <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Scanned PDF files (image-only PDFs) cannot have text extracted — upload text-based PDFs only.',
            'Analysis accuracy depends on how clearly the assignment is written. Vague briefs produce less precise results.',
            'Requires a valid Anthropic API key to perform analysis.',
            'AI suggestions for effort estimates are approximate and should not be treated as guarantees.',
            'The application does not connect to university portals or submission systems.',
            'No multi-user authentication — designed as a single-user local productivity tool.',
          ].map((l, i) => (
            <li key={i} style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

