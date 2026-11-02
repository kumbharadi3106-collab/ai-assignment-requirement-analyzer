# AI Assignment Requirement Analyzer

An intelligent student productivity web application that uses **Claude AI** to automatically extract and organize every requirement, deadline, task, and constraint from assignment briefs.

---

## Problem Statement

Students frequently receive lengthy assignment briefs containing complex instructions, multiple deliverables, restrictions, and deadlines. Manually parsing these is time-consuming, and students often miss important requirements — leading to lost marks or late submissions.

## Objectives

- Automatically extract all requirements from assignment instructions
- Generate an organized, actionable task checklist
- Identify and flag missing or conflicting information
- Track task completion with persistent storage
- Export analysis results for offline use

## Features

| Feature | Description |
|---|---|
| Text Input | Paste assignment instructions directly |
| PDF Upload | Upload and analyze PDF assignment documents |
| AI Analysis | Claude AI extracts requirements in structured format |
| Deliverables | Auto-extracts all submission items |
| Deadlines | Identifies all deadlines; flags missing ones |
| Constraints | Extracts all restrictions and rules |
| Evaluation Criteria | Extracts marks and grading criteria |
| Ambiguity Detection | Flags unclear or conflicting instructions |
| Action Plan | Generates step-by-step plan |
| Task Checklist | Interactive checklist with persistent completion status |
| Dashboard | Live statistics from database |
| Assignment History | Browse, search, and filter past analyses |
| CSV Export | Export analysis as spreadsheet |
| PDF Export | Export full analysis as PDF document |
| Source Verification | View original quotes for extracted information |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Lucide React, Axios |
| Backend | Node.js, Express.js |
| AI | Anthropic Claude API (official SDK) |
| Database | SQLite (better-sqlite3) |
| PDF Processing | pdf-parse (extraction), PDFKit (export) |
| CSV Export | json2csv |
| File Upload | Multer |

---

## Project Structure

```
ai-assignment-requirement-analyzer/
├── client/                        # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + header layout
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Alert.jsx
│   │   │   └── ConfirmModal.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Stats, recent assignments, deadlines
│   │   │   ├── NewAnalysis.jsx    # Text paste + PDF upload
│   │   │   ├── AnalysisResult.jsx # Full analysis display + checklist
│   │   │   ├── MyAssignments.jsx  # Assignment history
│   │   │   ├── TaskManager.jsx    # All tasks across assignments
│   │   │   ├── AboutProject.jsx   # Project documentation
│   │   │   └── Settings.jsx       # API key setup + system status
│   │   ├── services/api.js        # All API calls (axios)
│   │   ├── utils/helpers.js       # Date formatting, utilities
│   │   ├── App.jsx                # Routes
│   │   ├── main.jsx
│   │   └── index.css              # Complete design system
│   ├── package.json
│   └── vite.config.js             # Proxy: /api → localhost:5001
│
├── server/                        # Node.js/Express backend
│   ├── controllers/
│   │   ├── assignmentController.js # CRUD + analysis + export
│   │   ├── taskController.js       # Task list + update
│   │   └── uploadController.js     # PDF upload + analyze
│   ├── routes/
│   │   ├── assignmentRoutes.js
│   │   ├── taskRoutes.js
│   │   └── uploadRoutes.js
│   ├── services/
│   │   ├── claudeService.js       # Anthropic SDK integration
│   │   ├── pdfService.js          # PDF text extraction
│   │   └── exportService.js       # CSV + PDF generation
│   ├── prompts/
│   │   └── analysisPrompt.js      # System prompt + user prompt builder
│   ├── database/
│   │   └── db.js                  # SQLite init + connection
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── validateInput.js
│   │   └── upload.js              # Multer config
│   ├── utils/
│   │   └── responseValidator.js   # AI response validation
│   ├── tests/
│   │   └── testCases.js           # Five documented test cases
│   ├── server.js
│   └── package.json
│
├── docs/
│   ├── TESTING.md
│   ├── PROMPT_ENGINEERING.md
│   └── PROJECT_WORKFLOW.md
│
├── .env.example                   # Required env variable names
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

- Node.js v18 or higher
- npm
- An Anthropic API key (get one at https://console.anthropic.com)

### Step 1 — Clone / Open the project

```bash
cd "ai-assignment-requirement-analyzer"
```

### Step 2 — Install backend dependencies

```bash
cd server
npm install
```

### Step 3 — Configure environment variables

```bash
cp .env.example .env
```

Edit `server/.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
PORT=5001
```

### Step 4 — Install frontend dependencies

```bash
cd ../client
npm install
```

---

## Running the Application

### Start the backend server

```bash
cd server
npm start
```

Expected output:
```
Database initialized successfully
✅ Server running on http://localhost:5001
📊 API Health: http://localhost:5001/api/health
```

### Start the frontend (in a separate terminal)

```bash
cd client
npm run dev
```

Open: **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Server health check |
| GET | /api/assignments/dashboard | Dashboard statistics |
| POST | /api/assignments/analyze | Analyze text assignment |
| GET | /api/assignments | List all assignments |
| GET | /api/assignments/:id | Get one assignment with tasks |
| DELETE | /api/assignments/:id | Delete assignment and tasks |
| GET | /api/assignments/:id/export?format=csv | Export as CSV |
| GET | /api/assignments/:id/export?format=pdf | Export as PDF |
| POST | /api/upload | Upload and analyze PDF |
| GET | /api/tasks | Get all tasks (with filters) |
| PATCH | /api/tasks/:id | Update task status |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| ANTHROPIC_API_KEY | ✅ Yes | Your Anthropic Claude API key |
| ANTHROPIC_MODEL | Optional | Model name (default: claude-3-5-sonnet-20241022) |
| PORT | Optional | Server port (default: 5001) |

---

## Limitations

- Scanned PDF files (image-only) cannot be extracted — text-based PDFs only
- Requires a valid Anthropic API key
- Single-user local application — no authentication
- AI effort estimates are approximate and clearly labelled as such
- Does not connect to university portals or submission systems

---

## Testing

See `docs/TESTING.md` for all five test cases and results.

## Prompt Engineering

See `docs/PROMPT_ENGINEERING.md` for prompt design and rationale.

## Workflow

See `docs/PROJECT_WORKFLOW.md` for the complete data flow.

