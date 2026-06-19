require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Review = require("./models/Review");
const authMiddleware = require("./middleware/auth");

const { fetchFileContent } = require("./services/githubService");
const { lintCode } = require("./services/eslintService");
const { getAIFeedback } = require("./services/geminiService");

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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a review manually (protected)
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

// Full pipeline: fetch from GitHub -> lint -> AI review -> save
app.post("/api/review", authMiddleware, async (req, res) => {
  try {
    const { owner, repo, path } = req.body;

    if (!owner || !repo || !path) {
      return res
        .status(400)
        .json({ error: "owner, repo, and path are required" });
    }

    // Step 1: Fetch the file from GitHub
    const { fileName, content } = await fetchFileContent(owner, repo, path);

    // Step 2: Run ESLint static analysis
    const lintResult = await lintCode(content, fileName);

    // Step 3: Get AI-generated feedback from Gemini (don't let this fail the whole request)
    let aiFeedback;
    try {
      aiFeedback = await getAIFeedback(content, fileName);
    } catch (aiErr) {
      console.error("Gemini call failed:", aiErr.message);
      aiFeedback = "AI feedback unavailable right now. Please try again later.";
    }

    // Step 4: Combine everything into a feedback summary
    const combinedFeedback = `AI Review:\n${aiFeedback}\n\nStatic Analysis: ${lintResult.issueCount} issue(s) found.`;

    // Step 5: Save as a Review document
    const review = new Review({
      repoName: repo,
      fileName,
      feedback: combinedFeedback,
      userId: req.userId,
    });
    await review.save();

    // Step 6: Return the full result
    res.status(201).json({
      review,
      lintIssues: lintResult.issues,
      aiFeedback,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
