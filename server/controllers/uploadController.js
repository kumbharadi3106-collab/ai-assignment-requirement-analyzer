const { extractTextFromPDF } = require('../services/pdfService');
const { analyzeAssignment } = require('../services/claudeService');
const db = require('../database/db');

function extractTasksFromAnalysis(analysis, assignmentId) {
  const tasks = [];
  if (analysis.actionPlan && Array.isArray(analysis.actionPlan)) {
    analysis.actionPlan.forEach((stage) => {
      if (stage.tasks && Array.isArray(stage.tasks)) {
        stage.tasks.forEach((task) => {
          tasks.push({
            assignment_id: assignmentId,
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            status: 'pending',
            stage: stage.stage,
          });
        });
      }
    });
  }
  if (tasks.length === 0 && analysis.requirements) {
    analysis.requirements.forEach((req) => {
      tasks.push({
        assignment_id: assignmentId,
        title: req.title,
        description: req.description || '',
        priority: req.priority || 'medium',
        status: 'pending',
        stage: 'Requirements',
      });
    });
  }
  return tasks;
}

async function uploadAndAnalyze(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a PDF file.',
      });
    }

    const { title } = req.body;

    // Extract text from PDF
    const { text, pages } = await extractTextFromPDF(req.file.buffer);

    // Call Claude API
    const analysis = await analyzeAssignment(text);

    // Extract deadline
    let deadline = null;
    if (analysis.deadlines && analysis.deadlines.length > 0) {
      const finalDeadline = analysis.deadlines.find(d => d.type === 'final') || analysis.deadlines[0];
      deadline = finalDeadline.date || null;
    }

    // Save to database
    const insertAssignment = db.prepare(`
      INSERT INTO assignments (title, original_text, subject, analysis_json, deadline, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const assignmentTitle = title?.trim() || analysis.assignmentOverview?.title || req.file.originalname.replace('.pdf', '') || 'Uploaded Assignment';
    const result = insertAssignment.run(
      assignmentTitle,
      text,
      analysis.assignmentOverview?.subject || null,
      JSON.stringify(analysis),
      deadline
    );

    const assignmentId = result.lastInsertRowid;

    // Save deliverables
    if (analysis.deliverables?.length > 0) {
      const insertDeliverable = db.prepare(`
        INSERT INTO deliverables (assignment_id, name, description, mandatory, source_text)
        VALUES (?, ?, ?, ?, ?)
      `);
      analysis.deliverables.forEach(d => {
        insertDeliverable.run(assignmentId, d.name, d.description || '', d.mandatory ? 1 : 0, d.sourceText || '');
      });
    }

    // Save tasks
    const tasks = extractTasksFromAnalysis(analysis, assignmentId);
    if (tasks.length > 0) {
      const insertTask = db.prepare(`
        INSERT INTO tasks (assignment_id, title, description, priority, status, stage, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      tasks.forEach(task => {
        insertTask.run(task.assignment_id, task.title, task.description, task.priority, task.status, task.stage);
      });
    }

    const savedAssignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
    const savedTasks = db.prepare('SELECT * FROM tasks WHERE assignment_id = ?').all(assignmentId);

    res.json({
      success: true,
      pagesExtracted: pages,
      assignment: {
        ...savedAssignment,
        analysis,
        tasks: savedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadAndAnalyze };
