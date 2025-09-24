import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    tenantName: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);

        Swal.fire({
          icon: "success",
          title: "Registration Successful",
          text: "Your account has been created. Please log in.",
          timer: 2000,
          showConfirmButton: false,
        });

        navigate("/login"); // ✅ redirect to login
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: data.error || "Something went wrong.",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Unable to complete registration. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        className="card shadow-lg p-5 border-0"
        style={{ width: "420px", borderRadius: "15px" }}
      >
        <h2 className="text-center mb-4 fw-bold">Create Account</h2>

        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <input
              type="text"
              name="tenantName"
              className="form-control form-control-lg"
              placeholder="Tenant / Company Name"
              value={form.tenantName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="text"
              name="name"
              className="form-control form-control-lg"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="email"
              name="email"
              className="form-control form-control-lg"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              name="password"
              className="form-control form-control-lg"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-success w-100 btn-lg"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="text-center mt-4">
          <small>
            Already have an account?{" "}
            <Link to="/login" className="fw-bold text-decoration-none">
              Login
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
}

export default Register;
