import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Pricing from "./Pricing";

export default function App() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  // parse the user only once (so Dashboard receives an object)
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAuthenticated = !!token && !!user;

  return (
    <Router>
     <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={ isAuthenticated ? <Dashboard /> : <Navigate to="/login" /> } />
        <Route path="/pricing" element={ isAuthenticated ? <Pricing /> : <Navigate to="/login" /> } />
        <Route path="*" element={<Navigate to="/login" />} />
     </Routes>
    </Router>
  );
}
