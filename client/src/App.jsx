import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Review from "./pages/Review";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function Home() {
  const username = localStorage.getItem("username");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.reload();
  }

  return (
    <div>
      <h1>AI Code Review Platform</h1>
      {username ? (
        <div>
          <p>Welcome back, {username}!</p>
          <p>
            <Link to="/review">Go to Review Page</Link>
          </p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>
          Please <Link to="/login">login</Link> or{" "}
          <Link to="/register">register</Link>.
        </p>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;