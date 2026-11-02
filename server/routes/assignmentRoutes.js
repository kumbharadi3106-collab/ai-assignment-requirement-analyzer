const express = require('express');
const router = express.Router();
const { validateAnalyzeInput } = require('../middleware/validateInput');
const {
  analyzeText,
  getAllAssignments,
  getAssignmentById,
  deleteAssignment,
  getDashboardStats,
  exportAssignment,
} = require('../controllers/assignmentController');

router.get('/dashboard', getDashboardStats);
router.post('/analyze', validateAnalyzeInput, analyzeText);
router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);
router.delete('/:id', deleteAssignment);
router.get('/:id/export', exportAssignment);

module.exports = router;
