require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const User = require("./models/User");
const Review = require("./models/Review");
const authMiddleware = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

const { fetchFileContent } = require("./services/githubService");
const { lintCode } = require("./services/eslintService");
const { getAIFeedback } = require("./services/geminiService");

const app = express();
const PORT = process.env.PORT || 5000;
const rateLimit = require("express-rate-limit");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per window
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

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
app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

// Login
app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    next(err);
  }
});

// Create a review manually (protected)
app.post("/api/reviews", authMiddleware, async (req, res, next) => {
  try {
    const { repoName, fileName, feedback } = req.body;
    const review = new Review({
      repoName,
      fileName,
      feedback,
      userId: req.userId,
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

// Get all reviews
app.get("/api/reviews", async (req, res, next) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// Full pipeline: fetch from GitHub -> lint -> AI review -> save
app.post("/api/review", authMiddleware, async (req, res, next) => {
  try {
    const { owner, repo, path } = req.body;

    if (!owner || !repo || !path) {
      const error = new Error("owner, repo, and path are required");
      error.statusCode = 400;
      throw error;
    }

    const { fileName, content } = await fetchFileContent(owner, repo, path);
    const lintResult = await lintCode(content, fileName);

    let aiFeedback;
    try {
      aiFeedback = await getAIFeedback(content, fileName);
    } catch (aiErr) {
      console.error("Gemini call failed:", aiErr.message);
      aiFeedback = "AI feedback unavailable right now. Please try again later.";
    }

    const combinedFeedback = `AI Review:\n${aiFeedback}\n\nStatic Analysis: ${lintResult.issueCount} issue(s) found.`;

    const review = new Review({
      repoName: repo,
      fileName,
      feedback: combinedFeedback,
      userId: req.userId,
    });
    await review.save();

    res.status(201).json({
      review,
      lintIssues: lintResult.issues,
      aiFeedback,
    });
  } catch (err) {
    next(err);
  }
});

// Centralized error handler - must be registered last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
