require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const assignmentRoutes = require('./routes/assignmentRoutes');
const taskRoutes = require('./routes/taskRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Assignment Analyzer API is running',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  });
});

// Error handling
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('WARNING: ANTHROPIC_API_KEY is not set. Claude AI features will not work.');
      console.warn('   Please create a .env file with your API key. See .env.example for reference.');
    }
  });
}

module.exports = app;
