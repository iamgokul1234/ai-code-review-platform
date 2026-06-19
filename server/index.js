const express = require("express");
const app = express();
const PORT = 5000;

// Middleware: parses incoming JSON request bodies
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running and auto-reloading!" });
});

// New route to test receiving data
app.post("/api/echo", (req, res) => {
  res.json({ youSent: req.body });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});