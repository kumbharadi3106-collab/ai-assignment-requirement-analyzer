const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadAndAnalyze } = require('../controllers/uploadController');

router.post('/', upload.single('pdf'), uploadAndAnalyze);

module.exports = router;
