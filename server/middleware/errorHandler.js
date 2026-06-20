function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Something went wrong on our end." : err.message;

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;