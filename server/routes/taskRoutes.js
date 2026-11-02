const express = require('express');
const router = express.Router();
const { getAllTasks, updateTask } = require('../controllers/taskController');

router.get('/', getAllTasks);
router.patch('/:id', updateTask);

module.exports = router;
