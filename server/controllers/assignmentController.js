const db = require('../database/db');
const { analyzeAssignment } = require('../services/claudeService');
const { generateCSV, generatePDFBuffer } = require('../services/exportService');

function extractTasksFromAnalysis(analysis, assignmentId) {
  const tasks = [];

  // Extract from action plan
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

  // Also extract from requirements if no action plan tasks
  if (tasks.length === 0 && analysis.requirements && Array.isArray(analysis.requirements)) {
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

async function analyzeText(req, res, next) {
  try {
    const { title, text } = req.body;

    // Call Claude API
    const analysis = await analyzeAssignment(text);

    // Extract deadline from analysis
    let deadline = null;
    if (analysis.deadlines && analysis.deadlines.length > 0) {
      const finalDeadline = analysis.deadlines.find(d => d.type === 'final') || analysis.deadlines[0];
      deadline = finalDeadline.date || null;
    }

    // Save assignment to database
    const insertAssignment = db.prepare(`
      INSERT INTO assignments (title, original_text, subject, analysis_json, deadline, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = insertAssignment.run(
      title.trim() || analysis.assignmentOverview?.title || 'Untitled Assignment',
      text,
      analysis.assignmentOverview?.subject || null,
      JSON.stringify(analysis),
      deadline
    );

    const assignmentId = result.lastInsertRowid;

    // Save deliverables
    if (analysis.deliverables && analysis.deliverables.length > 0) {
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

    // Fetch the saved assignment with tasks
    const savedAssignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
    const savedTasks = db.prepare('SELECT * FROM tasks WHERE assignment_id = ? ORDER BY id').all(assignmentId);

    res.json({
      success: true,
      assignment: {
        ...savedAssignment,
        analysis: analysis,
        tasks: savedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
}

function getAllAssignments(req, res, next) {
  try {
    const assignments = db.prepare(`
      SELECT 
        a.*,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT d.id) as deliverable_count
      FROM assignments a
      LEFT JOIN tasks t ON t.assignment_id = a.id
      LEFT JOIN deliverables d ON d.assignment_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `).all();

    const formatted = assignments.map(a => ({
      ...a,
      analysis: JSON.parse(a.analysis_json),
      completion_percentage: a.task_count > 0
        ? Math.round((a.completed_tasks / a.task_count) * 100)
        : 0,
    }));

    res.json({ success: true, assignments: formatted });
  } catch (error) {
    next(error);
  }
}

function getAssignmentById(req, res, next) {
  try {
    const { id } = req.params;
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const tasks = db.prepare('SELECT * FROM tasks WHERE assignment_id = ? ORDER BY id').all(id);
    const deliverables = db.prepare('SELECT * FROM deliverables WHERE assignment_id = ?').all(id);

    res.json({
      success: true,
      assignment: {
        ...assignment,
        analysis: JSON.parse(assignment.analysis_json),
        tasks,
        deliverables,
        completion_percentage: tasks.length > 0
          ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;

    const assignment = db.prepare('SELECT id FROM assignments WHERE id = ?').get(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    // CASCADE will handle tasks and deliverables due to foreign key
    db.prepare('DELETE FROM assignments WHERE id = ?').run(id);

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
}

function getDashboardStats(req, res, next) {
  try {
    const totalAssignments = db.prepare('SELECT COUNT(*) as count FROM assignments').get().count;
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count;
    const pendingTasks = totalTasks - completedTasks;

    const recentAssignments = db.prepare(`
      SELECT 
        a.id, a.title, a.subject, a.deadline, a.created_at,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT d.id) as requirement_count
      FROM assignments a
      LEFT JOIN tasks t ON t.assignment_id = a.id
      LEFT JOIN deliverables d ON d.assignment_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `).all();

    const upcomingDeadlines = db.prepare(`
      SELECT id, title, deadline, created_at
      FROM assignments
      WHERE deadline IS NOT NULL AND deadline != ''
      ORDER BY deadline ASC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      stats: {
        totalAssignments,
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentAssignments: recentAssignments.map(a => ({
        ...a,
        completion_percentage: a.task_count > 0
          ? Math.round((a.completed_tasks / a.task_count) * 100)
          : 0,
      })),
      upcomingDeadlines,
    });
  } catch (error) {
    next(error);
  }
}

async function exportAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { format } = req.query;

    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const analysis = JSON.parse(assignment.analysis_json);

    if (format === 'csv') {
      const csv = generateCSV(assignment, analysis);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="assignment-${id}-analysis.csv"`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFBuffer(assignment, analysis);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="assignment-${id}-analysis.pdf"`);
      return res.send(pdfBuffer);
    }

    return res.status(400).json({ success: false, error: 'Invalid export format. Use csv or pdf.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeText,
  getAllAssignments,
  getAssignmentById,
  deleteAssignment,
  getDashboardStats,
  exportAssignment,
};
