import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { apiRequest } from "../api";

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
    <div className="container">
      <div className="eyebrow">review a file</div>
      <h2>Point this at a file.</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-6)" }}>
        Any public GitHub repo you have access to. We'll fetch it, lint it,
        and ask an AI reviewer what it thinks.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="owner">Owner</label>
          <input
            id="owner"
            type="text"
            placeholder="octocat"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="repo">Repository</label>
          <input
            id="repo"
            type="text"
            placeholder="hello-world"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="path">File path</label>
          <input
            id="path"
            type="text"
            placeholder="server/index.js"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Reviewing…" : "Run review"}
        </button>
      </form>

      {error && <div className="error-text">{error}</div>}

      {result && (
        <div className="results">
          <div className="results-file">{result.review.fileName}</div>

          <div className="terminal">
            <div className="terminal-header">ai review</div>
            <div className="terminal-body">
              <ReactMarkdown>{result.aiFeedback}</ReactMarkdown>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-header">
              lint — {result.lintIssues.length} issue
              {result.lintIssues.length === 1 ? "" : "s"}
            </div>
            {result.lintIssues.length === 0 ? (
              <div className="lint-empty">✓ no issues found</div>
            ) : (
              <ul className="lint-list">
                {result.lintIssues.map((issue, i) => (
                  <li key={i} className={`lint-row severity-${issue.severity}`}>
                    <span className="lint-line">L{issue.line}</span>
                    <span className="lint-message">{issue.message}</span>
                    <span className="lint-rule">{issue.rule}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Review;