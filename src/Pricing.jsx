import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [error, setError] = useState("");
  const [prices, setPrices] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fallbackPlans = [
    { id: "price_monthly_basic", name: "Basic (Monthly)", priceId: "price_1ABC...", amount: 1000, currency: "usd" },
    { id: "price_monthly_pro", name: "Pro (Monthly)", priceId: "price_1DEF...", amount: 2900, currency: "usd" },
  ];

  const formatAmount = (amount, currency) => {
    if (amount == null) return "—";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: (currency || "usd").toUpperCase(),
        minimumFractionDigits: 0,
      }).format(amount / 100);
    } catch {
      return `${(amount / 100).toFixed(2)} ${currency || "USD"}`;
    }
  };

  useEffect(() => {
    const fetchPrices = async () => {
      setPricesLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/api/billing/prices", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          setPrices(fallbackPlans);
          setPricesLoading(false);
          return;
        }

        const data = await res.json();
        if (data && Array.isArray(data.prices) && data.prices.length) {
          const normalized = data.prices.map((p) => ({
            id: p.id,
            name: p.nickname || (p.product && p.product.name) || p.id,
            priceId: p.id,
            amount: p.unit_amount,
            currency: p.currency,
            recurring: p.recurring,
          }));
          setPrices(normalized);
        } else {
          setPrices(fallbackPlans);
        }
      } catch (err) {
        console.error("Failed to fetch prices:", err);
        setPrices(fallbackPlans);
      } finally {
        setPricesLoading(false);
      }
    };

    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribe = async (priceId, friendlyName) => {
    setError("");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to subscribe to a plan.",
      });
      navigate("/login");
      return;
    }

    if (!priceId || priceId.includes("price_1ABC") || priceId.includes("price_1DEF")) {
      const msg = "Replace placeholder price IDs with real Stripe price IDs (or create prices in Stripe).";
      setError(msg);
      Swal.fire({
        icon: "error",
        title: "Invalid Price ID",
        text: msg,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId, plan: friendlyName }),
      });

      const data = await res.json();
      setLoading(false);

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
        Swal.fire({
          icon: "success",
          title: "Redirecting...",
          text: "You are being redirected to Stripe Checkout.",
          timer: 2000,
          showConfirmButton: false,
        });
        window.open(data.url, "_blank");
      } else {
        const msg = "Checkout URL not returned by server";
        setError(msg);
        Swal.fire({
          icon: "error",
          title: "Missing URL",
          text: msg,
        });
      }
    } catch (err) {
      setLoading(false);
      const msg = "Server error creating checkout session";
      setError(msg);
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: msg,
      });
    }
  };

  return (
    <div className="bg-light py-5">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Pricing Plans</h2>
          <Link to="/" className="btn btn-outline-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        {pricesLoading ? (
          <p className="text-center">Loading plans…</p>
        ) : (
          <div className="row justify-content-center">
            {prices.map((p) => {
              const isPro = p.name.toLowerCase().includes("pro");
              return (
                <div key={p.id} className="col-md-4 mb-4">
                  <div
                    className={`card h-100 shadow-sm text-center d-flex flex-column ${
                      isPro ? "border-primary shadow-lg" : ""
                    }`}
                  >
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">
                        {p.name}{" "}
                        {isPro && (
                          <span className="badge bg-primary ms-2">Most Popular</span>
                        )}
                      </h5>
                      <h6 className="card-subtitle mb-2 text-muted">
                        {formatAmount(p.amount, p.currency)}{" "}
                        {p.recurring ? `/ ${p.recurring.interval}` : ""}
                      </h6>
                      <small className="text-muted mb-3">ID: {p.priceId}</small>

                      <button
                        onClick={() => subscribe(p.priceId, p.name)}
                        disabled={loading}
                        className={`btn ${isPro ? "btn-primary" : "btn-outline-primary"} mt-auto`}
                      >
                        {loading ? "Redirecting…" : "Subscribe"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-muted text-center mt-4" style={{ fontSize: "0.9rem" }}>
          Tip: if you don't see plans, create a Product + Price in Stripe (Test mode), 
          then use the Dashboard → Developers → API keys / Prices or call GET /api/billing/prices.
        </p>
      </div>
    </div>
  );
}
