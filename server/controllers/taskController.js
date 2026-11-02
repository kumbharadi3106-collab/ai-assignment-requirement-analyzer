const db = require('../database/db');

function getAllTasks(req, res, next) {
  try {
    const { assignment_id, status, priority } = req.query;
    let query = `
      SELECT t.*, a.title as assignment_title 
      FROM tasks t
      LEFT JOIN assignments a ON a.id = t.assignment_id
      WHERE 1=1
    `;
    const params = [];

    if (assignment_id) {
      query += ' AND t.assignment_id = ?';
      params.push(assignment_id);
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    query += " ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.created_at DESC";

    const tasks = db.prepare(query).all(...params);
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
}

function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { status, priority, title, description } = req.body;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const updates = [];
    const values = [];

    if (status !== undefined) {
      if (!['pending', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Status must be pending or completed' });
      }
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAllTasks, updateTask };
