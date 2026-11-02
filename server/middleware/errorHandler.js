function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum file size is 10MB.',
    });
  }

  if (err.message && err.message.includes('Only PDF files')) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred. Please try again.';

  res.status(status).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
