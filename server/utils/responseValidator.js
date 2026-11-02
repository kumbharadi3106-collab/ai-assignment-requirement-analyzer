function validateAnalysisResponse(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Response is not a valid object'] };
  }

  // Check required top-level fields
  const requiredFields = ['assignmentOverview', 'deliverables', 'requirements', 'actionPlan'];
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate assignmentOverview
  if (data.assignmentOverview) {
    if (!data.assignmentOverview.title) {
      errors.push('assignmentOverview.title is required');
    }
    if (!data.assignmentOverview.summary) {
      errors.push('assignmentOverview.summary is required');
    }
  }

  // Ensure arrays are arrays
  const arrayFields = ['deliverables', 'requirements', 'constraints', 'deadlines', 'submissionRequirements', 'evaluationCriteria', 'ambiguities', 'actionPlan'];
  for (const field of arrayFields) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      errors.push(`${field} must be an array`);
    }
    // Initialize missing arrays as empty
    if (!data[field]) {
      data[field] = [];
    }
  }

  // Validate deadlines - ensure no invented dates
  if (data.deadlines && Array.isArray(data.deadlines)) {
    data.deadlines.forEach((deadline, i) => {
      if (!deadline.description) {
        errors.push(`deadlines[${i}].description is required`);
      }
    });
  }

  // Validate action plan
  if (data.actionPlan && Array.isArray(data.actionPlan)) {
    data.actionPlan.forEach((stage, i) => {
      if (!stage.stage) {
        errors.push(`actionPlan[${i}].stage is required`);
      }
      if (!Array.isArray(stage.tasks)) {
        data.actionPlan[i].tasks = [];
      }
    });
  }

  // Set defaults for optional fields
  if (!data.deadlineStatus) {
    data.deadlineStatus = data.deadlines && data.deadlines.length > 0 ? 'specified' : 'not_specified';
  }
  if (typeof data.hasConflicts !== 'boolean') {
    data.hasConflicts = false;
  }
  if (typeof data.completenessScore !== 'number') {
    data.completenessScore = 50;
  }

  return {
    valid: errors.length === 0,
    errors,
    data,
  };
}

module.exports = { validateAnalysisResponse };
