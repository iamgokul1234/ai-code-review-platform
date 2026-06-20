import { useState } from "react";
import { apiRequest } from "../api";
import ReactMarkdown from "react-markdown";

function Review() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [path, setPath] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await apiRequest("/api/review", {
        method: "POST",
        body: JSON.stringify({ owner, repo, path }),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Review a File</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="GitHub username (owner)"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Repository name"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="File path (e.g. server/index.js)"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Reviewing..." : "Review"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div>
          <h3>Results for {result.review.fileName}</h3>

          <h4>AI Feedback</h4>
          <div className="ai-feedback">
            <ReactMarkdown>{result.aiFeedback}</ReactMarkdown>
          </div>

          <h4>Lint Issues ({result.lintIssues.length})</h4>
          {result.lintIssues.length === 0 ? (
            <p>No issues found.</p>
          ) : (
            <ul>
              {result.lintIssues.map((issue, i) => (
                <li key={i}>
                  Line {issue.line}: [{issue.severity}] {issue.message} (
                  {issue.rule})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Review;
