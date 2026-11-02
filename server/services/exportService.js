const PDFDocument = require('pdfkit');

function generateCSV(assignment, analysis) {
  const rows = [];

  // Assignment info
  rows.push(['Section', 'Field', 'Value']);
  rows.push(['Assignment', 'Title', assignment.title || '']);
  rows.push(['Assignment', 'Subject', analysis.assignmentOverview?.subject || 'Not specified']);
  rows.push(['Assignment', 'Summary', analysis.assignmentOverview?.summary || '']);
  rows.push(['Assignment', 'Deadline', assignment.deadline || 'Not specified']);
  rows.push(['Assignment', 'Date Analyzed', assignment.created_at || '']);
  rows.push(['', '', '']);

  // Deliverables
  if (analysis.deliverables?.length > 0) {
    analysis.deliverables.forEach((d, i) => {
      rows.push(['Deliverable', `${i + 1}. ${d.name}`, d.description || '']);
      rows.push(['Deliverable', 'Mandatory', d.mandatory ? 'Yes' : 'No']);
    });
    rows.push(['', '', '']);
  }

  // Requirements
  if (analysis.requirements?.length > 0) {
    analysis.requirements.forEach((r, i) => {
      rows.push(['Requirement', `${i + 1}. ${r.title}`, r.description || '']);
      rows.push(['Requirement', 'Priority', r.priority || 'medium']);
    });
    rows.push(['', '', '']);
  }

  // Constraints
  if (analysis.constraints?.length > 0) {
    analysis.constraints.forEach((c, i) => {
      rows.push(['Constraint', `${i + 1}. ${c.type || 'Constraint'}`, c.description || '']);
    });
    rows.push(['', '', '']);
  }

  // Deadlines
  if (analysis.deadlines?.length > 0) {
    analysis.deadlines.forEach((d, i) => {
      rows.push(['Deadline', `${i + 1}. ${d.description}`, d.date || 'Not specified']);
      if (d.time) rows.push(['Deadline', 'Time', d.time]);
    });
    rows.push(['', '', '']);
  }

  // Evaluation Criteria
  if (analysis.evaluationCriteria?.length > 0) {
    analysis.evaluationCriteria.forEach((e, i) => {
      rows.push(['Evaluation', `${i + 1}. ${e.criterion}`, `${e.weightage || 'Not specified'} - ${e.description || ''}`]);
    });
  }

  // Convert to CSV string
  const csvContent = rows.map(row =>
    row.map(cell => {
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  ).join('\n');

  return csvContent;
}

function generatePDFBuffer(assignment, analysis) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buf => buffers.push(buf));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('Assignment Analysis Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica').text(assignment.title || 'Untitled Assignment', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.fillColor('#000');
    doc.moveDown(1);

    // Overview
    doc.fontSize(14).font('Helvetica-Bold').text('Assignment Overview');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    if (analysis.assignmentOverview) {
      if (analysis.assignmentOverview.subject) {
        doc.fontSize(11).font('Helvetica-Bold').text('Subject: ', { continued: true });
        doc.font('Helvetica').text(analysis.assignmentOverview.subject);
      }
      if (analysis.assignmentOverview.objective) {
        doc.fontSize(11).font('Helvetica-Bold').text('Objective: ', { continued: true });
        doc.font('Helvetica').text(analysis.assignmentOverview.objective);
      }
      if (analysis.assignmentOverview.summary) {
        doc.fontSize(11).font('Helvetica-Bold').text('Summary:');
        doc.font('Helvetica').fontSize(10).text(analysis.assignmentOverview.summary);
      }
    }
    doc.moveDown(1);

    // Deliverables
    if (analysis.deliverables?.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Deliverables');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      analysis.deliverables.forEach((d, i) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${d.name} ${d.mandatory ? '(Required)' : '(Optional)'}`);
        if (d.description) {
          doc.fontSize(10).font('Helvetica').text(d.description, { indent: 15 });
        }
        doc.moveDown(0.3);
      });
      doc.moveDown(0.5);
    }

    // Requirements
    if (analysis.requirements?.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Requirements');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      analysis.requirements.forEach((r, i) => {
        const priorityLabel = r.priority?.toUpperCase() || 'MEDIUM';
        doc.fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${r.title} [${priorityLabel}]`);
        if (r.description) {
          doc.fontSize(10).font('Helvetica').text(r.description, { indent: 15 });
        }
        doc.moveDown(0.3);
      });
      doc.moveDown(0.5);
    }

    // Constraints
    if (analysis.constraints?.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Constraints & Restrictions');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      analysis.constraints.forEach((c, i) => {
        doc.fontSize(10).font('Helvetica').text(`• ${c.description}`, { indent: 10 });
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);
    }

    // Deadlines
    doc.fontSize(14).font('Helvetica-Bold').text('Deadlines');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    if (analysis.deadlines?.length > 0) {
      analysis.deadlines.forEach((d) => {
        doc.fontSize(11).font('Helvetica-Bold').text(d.description);
        doc.fontSize(10).font('Helvetica').text(`Date: ${d.date || 'Not specified'}${d.time ? ' at ' + d.time : ''}`, { indent: 15 });
        doc.moveDown(0.3);
      });
    } else {
      doc.fontSize(10).font('Helvetica').text('No deadline specified in the assignment.');
    }
    doc.moveDown(0.5);

    // Evaluation
    if (analysis.evaluationCriteria?.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Evaluation Criteria');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      analysis.evaluationCriteria.forEach((e, i) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${e.criterion}${e.weightage ? ' - ' + e.weightage : ''}`);
        if (e.description) {
          doc.fontSize(10).font('Helvetica').text(e.description, { indent: 15 });
        }
        doc.moveDown(0.3);
      });
      doc.moveDown(0.5);
    }

    // Action Plan
    if (analysis.actionPlan?.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Action Plan');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      analysis.actionPlan.forEach((stage) => {
        doc.fontSize(12).font('Helvetica-Bold').text(stage.stage);
        if (stage.tasks) {
          stage.tasks.forEach((task) => {
            doc.fontSize(10).font('Helvetica-Bold').text(`  • ${task.title}`, { indent: 10 });
            if (task.description) {
              doc.fontSize(10).font('Helvetica').text(task.description, { indent: 25 });
            }
            doc.moveDown(0.2);
          });
        }
        doc.moveDown(0.3);
      });
    }

    // Ambiguities
    if (analysis.ambiguities?.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Issues & Ambiguities');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      analysis.ambiguities.forEach((a) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`! ${a.issue}`);
        if (a.reason) {
          doc.fontSize(10).font('Helvetica').text(a.reason, { indent: 15 });
        }
        if (a.recommendation) {
          doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Suggestion: ${a.recommendation}`, { indent: 15 });
          doc.fillColor('#000');
        }
        doc.moveDown(0.3);
      });
    }

    doc.end();
  });
}

module.exports = { generateCSV, generatePDFBuffer };
