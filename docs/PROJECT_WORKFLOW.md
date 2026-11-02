# Project Workflow Documentation

## Complete Data Flow

```
Student Input
    │
    ▼
Input Validation (middleware)
    │
    ├── Empty text? → Reject with error message
    ├── Text too short? → Reject with error message
    ├── Text too long (>50,000 chars)? → Reject with error message
    ├── Invalid file type? → Reject with error message
    └── File too large (>10MB)? → Reject with error message
    │
    ▼
PDF Text Extraction (if PDF upload)
    │
    ├── Not a valid PDF? → Reject with error
    ├── No extractable text (scanned image)? → Reject with helpful message
    ├── Empty PDF? → Reject with error
    └── Success → extracted text string
    │
    ▼
Claude AI Analysis
    │
    ├── Build structured prompt (analysisPrompt.js)
    ├── Call Anthropic API (claudeService.js)
    ├── API key missing? → Return error
    ├── Rate limited? → Return user-friendly error
    └── Success → Raw JSON text from Claude
    │
    ▼
AI Response Validation (responseValidator.js)
    │
    ├── Invalid JSON? → Return error (don't display partial data)
    ├── Missing required fields? → Return error
    ├── Fix missing optional arrays (set to [])
    └── Success → Validated analysis object
    │
    ▼
SQLite Database Storage (database/db.js)
    │
    ├── INSERT into assignments table
    ├── INSERT deliverables into deliverables table
    ├── Extract tasks from actionPlan
    └── INSERT tasks into tasks table
    │
    ▼
API Response → Frontend
    │
    ▼
React Frontend Display (AnalysisResult.jsx)
    │
    ├── Overview section
    ├── Deliverables cards
    ├── Requirements with priority badges
    ├── Constraints list
    ├── Deadlines (or "No deadline specified" warning)
    ├── Submission requirements
    ├── Evaluation criteria
    ├── Ambiguities & warnings (flagged visually)
    ├── Action plan stages
    └── Interactive task checklist
    │
    ▼
Student Interaction
    │
    ├── Mark tasks complete → PATCH /api/tasks/:id → SQLite update
    ├── Export CSV → GET /api/assignments/:id/export?format=csv
    ├── Export PDF → GET /api/assignments/:id/export?format=pdf
    └── Delete assignment → DELETE /api/assignments/:id → Cascade delete tasks
```

---

## Database Schema

### assignments
| Column | Type | Description |
|---|---|---|
| id | INTEGER PRIMARY KEY | Auto-increment |
| title | TEXT | Assignment title |
| original_text | TEXT | Full original assignment text |
| subject | TEXT | Course/subject (nullable) |
| analysis_json | TEXT | Complete Claude analysis as JSON string |
| deadline | TEXT | Extracted final deadline (nullable) |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

### tasks
| Column | Type | Description |
|---|---|---|
| id | INTEGER PRIMARY KEY | Auto-increment |
| assignment_id | INTEGER | Foreign key → assignments.id |
| title | TEXT | Task title |
| description | TEXT | Task description |
| priority | TEXT | high / medium / low |
| status | TEXT | pending / completed |
| stage | TEXT | Action plan stage name |
| due_date | TEXT | Optional task-level deadline |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

### deliverables
| Column | Type | Description |
|---|---|---|
| id | INTEGER PRIMARY KEY | Auto-increment |
| assignment_id | INTEGER | Foreign key → assignments.id |
| name | TEXT | Deliverable name |
| description | TEXT | Description |
| mandatory | INTEGER | 1 = required, 0 = optional |
| source_text | TEXT | Original quote from assignment |
| created_at | TEXT | ISO timestamp |

**Foreign Keys:** Both tasks and deliverables use `ON DELETE CASCADE` — deleting an assignment automatically removes all its tasks and deliverables.

---

## API Architecture

### Route → Controller → Service

```
HTTP Request
    │
    ▼
Express Router (routes/)
    │
    ▼
Middleware (validate input, multer upload)
    │
    ▼
Controller (controllers/)
    │        │
    │        ├── claudeService.js    (AI calls)
    │        ├── pdfService.js       (PDF extraction)
    │        ├── exportService.js    (CSV/PDF generation)
    │        └── database/db.js      (SQLite queries)
    │
    ▼
JSON Response
```

### Separation of Concerns

| Layer | File | Responsibility |
|---|---|---|
| Routes | routes/*.js | URL mapping only |
| Middleware | middleware/*.js | Validation, file handling, error formatting |
| Controllers | controllers/*.js | Request/response handling, orchestration |
| Services | services/*.js | External integrations (Claude, PDF, export) |
| Database | database/db.js | SQLite connection and table initialization |
| Prompts | prompts/analysisPrompt.js | AI prompt templates |
| Utils | utils/responseValidator.js | AI response validation logic |

---

## Security Measures

| Risk | Mitigation |
|---|---|
| API key exposure | Key stored only in server .env, never sent to frontend |
| SQL injection | All queries use parameterized statements (better-sqlite3 .prepare()) |
| Malicious file upload | Multer validates MIME type and file size before processing |
| Large input DoS | Input length limited to 50,000 characters |
| Cross-origin requests | CORS configured to allow only frontend origin |
| Sensitive files committed | .gitignore excludes .env, database files, node_modules |
| Malformed AI response | Response validated before database write or display |

