import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function Dashboard() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState("");
  const [status, setStatus] = useState("pending");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("pending");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [subscription, setSubscription] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanAmount, setNewPlanAmount] = useState("");
  const [newPlanInterval, setNewPlanInterval] = useState("month");
  const [creatingPlan, setCreatingPlan] = useState(false);

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Redirect if not logged in
  useEffect(() => {
    if (!user || !token) navigate("/login");
  }, [user, token, navigate]);

  // Fetch projects
  useEffect(() => {
    if (!token) return;
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) {
          setError(data.error || "Failed to fetch projects");
          return;
        }
        setProjects(data.projects || []);
      } catch {
        setLoading(false);
        setError("Server error while fetching projects");
      }
    };
    fetchProjects();
  }, [token, API_BASE_URL]);

  // Fetch tenant subscription
  useEffect(() => {
    if (!token) return;
    const fetchSubscription = async () => {
      setBillingLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/billing/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBillingLoading(false);
        if (!res.ok) return setSubscription(null);
        setSubscription(data.subscription || null);
      } catch (err) {
        setBillingLoading(false);
        console.error("Failed fetching subscription:", err);
        setSubscription(null);
      }
    };
    fetchSubscription();
  }, [token, API_BASE_URL]);

  // Fetch Stripe prices
  useEffect(() => {
    if (!token) return;
    const fetchPrices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/billing/prices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) return;
        setPlans(data.prices || []);
      } catch (err) {
        console.error("Failed fetching plans:", err);
      }
    };
    fetchPrices();
  }, [token, API_BASE_URL]);

  // Add a project
  const addProject = async (e) => {
    e.preventDefault();
    if (!newProject) return;
    setError("");
    setMessage("");
    setActionLoadingId("create");
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newProject, status }),
      });
      const data = await res.json();
      setActionLoadingId(null);
      if (!res.ok) return setError(data.error || "Failed to add project");
      setProjects([data.project, ...projects]);
      setNewProject("");
      setStatus("pending");
      setMessage("Project added successfully!");
    } catch {
      setActionLoadingId(null);
      setError("Server error adding project");
    }
  };

  // Edit project
  const startEdit = (proj) => {
    setEditingId(proj.id);
    setEditName(proj.name);
    setEditStatus(proj.status || "pending");
    setMessage("");
    setError("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditStatus("pending");
  };
  const saveEdit = async (id) => {
    if (!editName) return setError("Name is required");
    setActionLoadingId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, status: editStatus }),
      });
      const data = await res.json();
      setActionLoadingId(null);
      if (!res.ok) return setError(data.error || "Failed to update project");
      setProjects((prev) => prev.map((p) => (p.id === id ? data.project : p)));
      cancelEdit();
      setMessage("Project updated");
    } catch {
      setActionLoadingId(null);
      setError("Server error updating project");
    }
  };

  // Delete project
  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project? This action cannot be undone."))
      return;
    setActionLoadingId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setActionLoadingId(null);
      if (!res.ok) return setError(data.error || "Failed to delete project");
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setMessage("Project deleted");
    } catch {
      setActionLoadingId(null);
      setError("Server error deleting project");
    }
  };

  // Create Checkout Session
  const createCheckout = async (priceId, planLabel) => {
    setCheckoutLoading(true);
    setError("");
    setMessage("");

    if (!priceId || priceId.includes("price_1ABC") || priceId.includes("price_1DEF")) {
      setCheckoutLoading(false);
      setError("Replace placeholder price IDs with real Stripe price IDs (or create prices in Stripe).");
      Swal.fire({
        icon: "error",
        title: "Invalid Price ID",
        text: "Replace placeholder price IDs with real Stripe price IDs (or create prices in Stripe).",
      });
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/billing/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priceId, plan: planLabel }),
        }
      );

      const data = await res.json();
      setCheckoutLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to create checkout session");
        Swal.fire({
          icon: "error",
          title: "Checkout Failed",
          text: data.error || "Failed to create checkout session",
        });
        return;
      }

      if (data.url) {
        window.open(data.url, "_blank");
        Swal.fire({
          icon: "success",
          title: "Redirecting...",
          text: "You are being redirected to Stripe Checkout.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        setError("Checkout URL not returned by server");
        Swal.fire({
          icon: "error",
          title: "No Checkout URL",
          text: "Checkout URL not returned by server",
        });
      }
    } catch {
      setCheckoutLoading(false);
      setError("Server error initiating checkout");
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong while initiating checkout",
      });
    }
  };

  // Create new Stripe product + price
  const createPlan = async (e) => {
    e.preventDefault();
    if (!newPlanName || !newPlanAmount)
      return setError("Name and amount are required");
    setCreatingPlan(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/create-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPlanName,
          amount: parseInt(newPlanAmount, 10),
          interval: newPlanInterval,
        }),
      });
      const data = await res.json();
      setCreatingPlan(false);
      if (!res.ok) return setError(data.error || "Failed to create plan");
      setPlans((prev) => [...prev, data.price]);
      setNewPlanName("");
      setNewPlanAmount("");
      setNewPlanInterval("month");
      setMessage("New plan created successfully!");
    } catch {
      setCreatingPlan(false);
      setError("Server error creating plan");
    }
  };

  // Helper
  const formatPeriodEnd = (secs) => {
    if (!secs) return "—";
    try {
      return new Date(secs * 1000).toLocaleString();
    } catch {
      return "—";
    }
  };



  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Dashboard</h1>
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>

      {/* Profile Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="card-title">Welcome, {user?.name || "User"}</h4>
          <p className="mb-1">
            <b>Email:</b> {user?.email}
          </p>
          <p className="mb-1">
            <b>Role:</b> {user?.role}
          </p>
          <p className="mb-0">
            <b>Tenant ID:</b> {user?.tenant_id}
          </p>
        </div>
      </div>

      {/* Billing section */}
      {user?.role === "admin" && (
        <div className="bg-light rounded p-4 mb-4">
          <h4 className="mb-3">Billing & Subscription</h4>
          {billingLoading ? (
            <p>Loading subscription...</p>
          ) : subscription ? (
            <div className="mb-3">
              <p>
                <b>Plan:</b> {subscription.plan || "—"}
              </p>
              <p>
                <b>Status:</b> {subscription.subscription_status || "—"}
              </p>
              {subscription.stripe_subscription && (
                <p>
                  <b>Stripe status:</b>{" "}
                  {subscription.stripe_subscription.status} — period end:{" "}
                  {formatPeriodEnd(
                    subscription.stripe_subscription.current_period_end
                  )}
                </p>
              )}
            </div>
          ) : (
            <p>No subscription data (tenant may be on free plan).</p>
          )}

          <div className="mb-3 d-flex align-items-center">
            <Link to="/pricing" className="btn btn-primary me-3">
              Manage Billing
            </Link>
            <span className="text-muted small">Quick subscribe:</span>
          </div>

          <div className="row">
            {plans.length === 0 ? (
              <p className="text-center">Loading plans...</p>
            ) : (
              plans.map((p) => (
                <div key={p.id} className="col-md-4 mb-3">
                  <div
                    className={`card h-100 shadow-sm ${
                      p.nickname?.toLowerCase().includes("pro")
                        ? "border-primary"
                        : ""
                    }`}
                  >
                    <div className="card-body text-center d-flex flex-column">
                      <h5
                        className={`card-title ${
                          p.nickname?.toLowerCase().includes("pro")
                            ? "text-primary fw-bold"
                            : ""
                        }`}
                      >
                        {p.nickname || p.id}
                      </h5>
                      <h6 className="card-subtitle mb-2 text-muted">
                        {p.currency?.toUpperCase()} {(p.unit_amount / 100).toFixed(2)} /{" "}
                        {p.recurring?.interval || "once"}
                      </h6>

                      <button
                        className="btn btn-success mt-auto"
                        onClick={() => createCheckout(p.id, p.nickname || p.id)}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? "Redirecting..." : "Subscribe"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create New Plan */}
          <div className="mt-4">
            <h5>Create New Plan</h5>
            <form onSubmit={createPlan} className="row g-2 align-items-center">
              <div className="col-md">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Plan name"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount (USD cents)"
                  value={newPlanAmount}
                  onChange={(e) => setNewPlanAmount(e.target.value)}
                  required
                />
              </div>
              <div className="col-md">
                <select
                  className="form-select"
                  value={newPlanInterval}
                  onChange={(e) => setNewPlanInterval(e.target.value)}
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
              <div className="col-md-auto">
                <button
                  type="submit"
                  className="btn btn-outline-primary"
                  disabled={creatingPlan}
                >
                  {creatingPlan ? "Creating..." : "Add Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="card-title">Create New Project</h4>
          <form onSubmit={addProject} className="row g-2 align-items-center mt-2">
            <div className="col-md">
              <input
                type="text"
                className="form-control"
                placeholder="Project name"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                required
              />
            </div>
            <div className="col-md">
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-md-auto">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={actionLoadingId === "create"}
              >
                {actionLoadingId === "create" ? "Adding..." : "Add Project"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="card-title">Your Projects</h4>
          {projects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            <div className="table-responsive mt-3">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => (
                    <tr key={proj.id}>
                      <td>
                        {editingId === proj.id ? (
                          <input
                            className="form-control"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          proj.name
                        )}
                      </td>
                      <td>
                        {editingId === proj.id ? (
                          <select
                            className="form-select"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                        ) : (
                          proj.status
                        )}
                      </td>
                      <td>
                        {proj.created_at
                          ? new Date(proj.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {editingId === proj.id ? (
                          <>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => saveEdit(proj.id)}
                              disabled={actionLoadingId === proj.id}
                            >
                              {actionLoadingId === proj.id
                                ? "Saving..."
                                : "Save"}
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => startEdit(proj)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteProject(proj.id)}
                              disabled={actionLoadingId === proj.id}
                            >
                              {actionLoadingId === proj.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
