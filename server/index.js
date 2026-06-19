require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Octokit } = require("octokit");
const { ESLint } = require("eslint");

const User = require("./models/User");
const Review = require("./models/Review");
const authMiddleware = require("./middleware/auth");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running and auto-reloading!" });
});

app.post("/api/echo", (req, res) => {
  res.json({ youSent: req.body });
});

// Register a new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare submitted password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Issue a JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a review (protected)
app.post("/api/reviews", authMiddleware, async (req, res) => {
  try {
    const review = new Review({ ...req.body, userId: req.userId });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all reviews
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get authenticated user's GitHub repos
app.get("/api/github/repos", authMiddleware, async (req, res) => {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const response = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 10,
    });

    const repos = response.data.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
    }));

    res.json(repos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a file's content from a GitHub repo
app.get("/api/github/file", authMiddleware, async (req, res) => {
  try {
    const { owner, repo, path } = req.query;

    if (!owner || !repo || !path) {
      return res
        .status(400)
        .json({ error: "owner, repo, and path are required" });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const response = await octokit.rest.repos.getContent({ owner, repo, path });

    // File content comes back Base64-encoded
    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8",
    );

    res.json({ fileName: response.data.name, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/analyze", authMiddleware, async (req, res) => {
  try {
    const { code, fileName } = req.body;

    if (!code) {
      return res.status(400).json({ error: "code is required" });
    }

    const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });

    const results = await eslint.lintText(code, {
      filePath: fileName || "submitted-code.js",
    });

    const issues = results[0].messages.map((msg) => ({
      line: msg.line,
      column: msg.column,
      severity: msg.severity === 2 ? "error" : "warning",
      rule: msg.ruleId,
      message: msg.message,
    }));

    res.json({
      fileName: fileName || "submitted-code.js",
      issueCount: issues.length,
      issues,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai-review", authMiddleware, async (req, res) => {
  try {
    const { code, fileName } = req.body;

    if (!code) {
      return res.status(400).json({ error: "code is required" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are a senior software engineer doing a code review.
Review the following file (${fileName || "unnamed file"}) and give concise, actionable feedback.
Focus on: code quality, potential bugs, security concerns, and best practices.
Keep your response under 200 words, formatted as a short bulleted list.

Code:
\`\`\`
${code}
\`\`\`
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      fileName: fileName || "unnamed file",
      feedback: response.text,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
