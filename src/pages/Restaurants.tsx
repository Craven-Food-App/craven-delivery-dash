// src/pages/Restaurants.tsx
import React, { useState, useRef } from "react";

const Restaurants: React.FC = () => {
  const [address, setAddress] = useState("");
  const catsRef = useRef<HTMLDivElement | null>(null);

  const handleFind = () => {
    if (!address.trim()) {
      alert("Type an address or search term (e.g., 'pizza near me')");
      return;
    }
    const q = encodeURIComponent(address);
    window.location.href = "/search?q=" + q;
  };

  // Category scroll-drag behavior (converted from your script)
  const onMouseDown = (e: React.MouseEvent) => {
    const el = catsRef.current;
    if (!el) return;
    el.dataset.isDown = "true";
    el.dataset.startX = (e.pageX - el.offsetLeft).toString();
    el.dataset.scrollLeft = el.scrollLeft.toString();
  };

  const onMouseLeave = () => {
    if (catsRef.current) catsRef.current.dataset.isDown = "false";
  };
  const onMouseUp = () => {
    if (catsRef.current) catsRef.current.dataset.isDown = "false";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const el = catsRef.current;
    if (!el || el.dataset.isDown !== "true") return;
    e.preventDefault();
    const startX = parseInt(el.dataset.startX || "0", 10);
    const scrollLeft = parseInt(el.dataset.scrollLeft || "0", 10);
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.2;
    el.scrollLeft = scrollLeft - walk;
  };

  const year = new Date().getFullYear();

  return (
    <div className="container">
      {/* Header */}
      <header>
        <div className="brand">
          <div className="logo">D</div>
          <div>
            <div style={{ fontWeight: 800 }}>Deliverly</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              Everything from local shops
            </div>
          </div>
        </div>
        <nav>
          <a href="#" className="primary">
            Find restaurants
          </a>
          <a href="#">DashPass</a>
          <a href="#">Become a Dasher</a>
          <a href="#">Help</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="left">
          <h1>Everything you crave, delivered.</h1>
          <p>
            Find restaurants, grocery, convenience stores, and more—delivered
            fast.
          </p>

          <div className="search">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter delivery address or search for a restaurant"
            />
            <button className="btn" onClick={handleFind}>
              Find restaurants
            </button>
          </div>

          <div className="cta">
            <button className="btn">Get the app</button>
            <button className="btn ghost">Sign up</button>
          </div>
        </div>

        <aside className="preview">
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            Popular near you
          </div>
          <div className="card">
            <div className="thumb">🍕</div>
            <div>
              <div style={{ fontWeight: 700 }}>Tom's Pizza</div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                30–40 min · $$
              </div>
            </div>
          </div>
          <div className="card">
            <div className="thumb">🛒</div>
            <div>
              <div style={{ fontWeight: 700 }}>Neighborhood Market</div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                Groceries · 20–30 min
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Categories */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "18px",
        }}
      >
        <h2 style={{ margin: 0 }}>Popular categories</h2>
        <a
          href="#"
          style={{
            color: "var(--accent)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          See all
        </a>
      </div>

      <div
        className="categories"
        ref={catsRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        <div className="cat">
          <h4>Pizza</h4>
          <p>Local slices & chains</p>
        </div>
        <div className="cat">
          <h4>Grocery</h4>
          <p>Fresh produce & essentials</p>
        </div>
        <div className="cat">
          <h4>Convenience</h4>
          <p>Snacks & household</p>
        </div>
        <div className="cat">
          <h4>Alcohol</h4>
          <p>Beer, wine & spirits</p>
        </div>
        <div className="cat">
          <h4>Flowers</h4>
          <p>Same-day bouquets</p>
        </div>
      </div>

      {/* Features */}
      <div className="grid">
        <div className="feature">
          <h3>DashPass</h3>
          <p>Delivery for less with membership and exclusive perks.</p>
        </div>
        <div className="feature">
          <h3>Become a Dasher</h3>
          <p>Drive on your schedule and earn money.</p>
        </div>
        <div className="feature">
          <h3>DashMart & Grocery</h3>
          <p>Groceries and convenience items delivered fast.</p>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div>
          © {year} Deliverly · <a href="#">Terms</a> · <a href="#">Privacy</a>
        </div>
        <div style={{ color: "var(--muted)" }}>English (US)</div>
      </footer>
    </div>
  );
};

export default Restaurants;
