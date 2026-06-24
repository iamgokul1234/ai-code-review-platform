import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Review from "./pages/Review";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function TopBar() {
  const username = localStorage.getItem("username");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/";
  }

  return (
    <div className="topbar">
      <Link to="/" className="topbar-brand">
        <span className="dot"></span>
        ai-code-review
      </Link>
      <div className="topbar-actions">
        {username ? (
          <>
            <span className="username">{username}</span>
            <button className="btn-ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </div>
    </div>
  );
}

function Home() {
  const username = localStorage.getItem("username");

  return (
    <div className="container">
      <div className="eyebrow">code review, automated</div>
      <h1>Ship code with a second pair of eyes.</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: "480px" }}>
        Point this at any public file in your GitHub repos. It runs ESLint
        and an AI reviewer against it, and hands back what it finds.
      </p>

      {username ? (
        <p style={{ marginTop: "var(--space-6)" }}>
          <Link to="/review">Review a file →</Link>
        </p>
      ) : (
        <p style={{ marginTop: "var(--space-6)" }}>
          <Link to="/register">Create an account</Link> to get started.
        </p>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="page">
        <TopBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/review"
            element={
              <ProtectedRoute>
                <Review />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;