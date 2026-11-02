function validateAnalyzeInput(req, res, next) {
  const { title, text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Assignment text is required. Please paste your assignment instructions.',
    });
  }

  if (text.trim().length < 20) {
    return res.status(400).json({
      success: false,
      error: 'Assignment text is too short. Please provide complete assignment instructions.',
    });
  }

  if (text.length > 50000) {
    return res.status(400).json({
      success: false,
      error: 'Assignment text is too long. Maximum length is 50,000 characters.',
    });
  }

  if (!title || title.trim().length === 0) {
    req.body.title = 'Untitled Assignment';
  }

  next();
}

module.exports = { validateAnalyzeInput };
