import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Pricing from "./Pricing";

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Read localStorage after hydration
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    setToken(t);
    setUser(u ? JSON.parse(u) : null);
    setHydrated(true);
  }, []);

  if (!hydrated) return null; // prevent first render until localStorage is read

  const isAuthenticated = !!token && !!user;

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/pricing"
          element={isAuthenticated ? <Pricing /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
