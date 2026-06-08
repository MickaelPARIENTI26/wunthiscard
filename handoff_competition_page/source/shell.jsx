// Shared UI primitives for WinUCard Drop
const { useState, useEffect, useRef, useMemo } = React;

// Router
window.useRoute = function () {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");
  useEffect(() => {
    const h = () => {
      setRoute(window.location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return [route, (r) => { window.location.hash = r; }];
};

window.Link = function Link({ to, children, className, style, onClick }) {
  return (
    <a
      href={"#" + to}
      className={className}
      style={style}
      onClick={(e) => { if (onClick) onClick(e); }}
    >
      {children}
    </a>
  );
};

// Brand mark — star in a green square
window.BrandMark = function BrandMark({ size = 34 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, fontSize: size * 0.55 }}>★</span>
  );
};

// Nav
window.Nav = function Nav() {
  const [route, go] = window.useRoute();
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#/" className="brand"><BrandMark />WinUCard</a>
        <div className="nav-links">
          {window.WUC.nav.map((l, i) => (
            <a key={i} href={"#" + l.route} className={route.startsWith(l.route) ? "active" : ""}>{l.label}</a>
          ))}
        </div>
        <div className="nav-cta">
          <a href="#/login" className="btn btn-ghost">Log In</a>
          <a href="#/register" className="btn btn-primary">Sign Up</a>
        </div>
      </div>
    </nav>
  );
};

// Footer
window.Footer = function Footer() {
  const f = window.WUC.footer;
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <a href="#/" className="footer-brand"><BrandMark size={28} />WinUCard</a>
          <p className="footer-desc">UK's premium skill-based card competition platform. Must be 18+. Please play responsibly.</p>
          <div className="footer-socials">
            {f.socials.map((s, i) => <span key={i} className="sochip">{s}</span>)}
          </div>
        </div>
        <div className="footer-col">
          <h5>Platform</h5>
          <ul>{f.platform.map((l, i) => <li key={i}><a href={"#" + l.route}>{l.label}</a></li>)}</ul>
        </div>
        <div className="footer-col">
          <h5>Support</h5>
          <ul>{f.support.map((l, i) => <li key={i}><a href={"#" + l.route}>{l.label}</a></li>)}</ul>
        </div>
        <div className="footer-col">
          <h5>Legal</h5>
          <ul>{f.legal.map((l, i) => <li key={i}><a href={"#" + l.route}>{l.label}</a></li>)}</ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 WinUCard Ltd. All rights reserved.</span>
        <span>🔒 SSL Secured · ⚑ UK Registered</span>
      </div>
    </footer>
  );
};

// Page header (shared for internal pages)
window.PageHeader = function PageHeader({ eyebrow, title, subtitle, accent = "green" }) {
  return (
    <header className={`page-header page-header-${accent}`}>
      <div className="page-header-inner">
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
    </header>
  );
};

// Countdown
window.Countdown = function Countdown({ iso }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const end = new Date(iso).getTime();
    const tick = () => {
      const d = end - Date.now();
      if (d < 0) return setT("ENDED");
      const days = Math.floor(d / 86400000);
      const h = Math.floor((d % 86400000) / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setT(`${days > 0 ? days + "d " : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return <span>{t}</span>;
};

// Competition card (list + home)
window.CompCard = function CompCard({ c }) {
  const pct = Math.round((c.sold / parseInt(c.total.replace(/,/g, ""))) * 100);
  const isOpen = c.status === "Open";
  return (
    <a href={`#/competitions/${c.slug}`} className="comp-card">
      <div className="comp-visual">
        <span className={`comp-game ${c.game.toLowerCase().replace(" ", "-")}`}>{c.game}</span>
        <span className={`comp-status ${isOpen ? "open" : "soon"}`}>● {c.status}</span>
        <img src={c.img} alt={c.title} />
      </div>
      <div className="comp-body">
        <h3 className="comp-title">{c.title}</h3>
        <div className="comp-value">{c.value}</div>
        <div className="comp-progress">
          <div className="comp-progress-bar">
            <div className="comp-progress-fill" style={{ width: Math.max(pct, 3) + "%" }} />
          </div>
          <div className="comp-progress-meta">
            <span>{c.sold} / {c.total} sold</span>
            <span>{c.left} tickets left</span>
          </div>
        </div>
        <div className="comp-row">
          <div>
            <div className="comp-price">{c.ticket}</div>
            <div className="comp-per">per ticket</div>
          </div>
          {isOpen ? <span className="comp-cta">Enter Now →</span>
                  : <span className="comp-cta ghost">View Details</span>}
        </div>
      </div>
    </a>
  );
};

// CTA band
window.CTABand = function CTABand({ title, subtitle, primary = { label: "Sign Up Free", route: "/register" }, secondary = { label: "View Competitions", route: "/competitions" } }) {
  return (
    <section className="cta-band">
      <div className="cta-inner">
        <h2 className="cta-title">{title || <>Ready to <span className="chip">win</span>?</>}</h2>
        <p className="cta-sub">{subtitle || "Create your free account and enter our live competitions."}</p>
        <div className="cta-actions">
          <a href={"#" + primary.route} className="btn btn-primary">{primary.label} →</a>
          <a href={"#" + secondary.route} className="btn btn-ghost">{secondary.label}</a>
        </div>
        <p className="cta-small">18+ only · Free postal entry available · T&Cs apply</p>
      </div>
    </section>
  );
};

// Trust strip
window.TrustStrip = function TrustStrip() {
  const items = [
    { icon: "🔒", label: "Secure Payments" },
    { icon: "📺", label: "Live Draws" },
    { icon: "🚚", label: "Free Delivery" },
    { icon: "✉️", label: "Free Postal Entry" },
    { icon: "✓", label: "PSA 10 Authenticated" }
  ];
  return (
    <div className="trust-strip">
      {items.map((i, j) => (
        <span key={j} className="trust-item"><span className="trust-icon">{i.icon}</span>{i.label}</span>
      ))}
    </div>
  );
};
