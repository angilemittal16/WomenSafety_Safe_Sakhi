function errorHandler(err, req, res, next) {
  console.error('[Error Handler]:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred. Please try again.'
  });
}

module.exports = errorHandler;
