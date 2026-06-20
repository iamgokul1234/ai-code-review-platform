import { Navigate } from "react-router-dom";

function isTokenValid(token) {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    return !isExpired;
  } catch {
    return false;
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!isTokenValid(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;