// App shell + hash router
const { useState: _uSA } = React;

function parseRoute(hash) {
  const raw = (hash || "").split("#")[0]; // strip in-page anchors
  const parts = raw.split("/").filter(Boolean);
  return parts;
}

function App() {
  const [route] = window.useRoute();
  const [rootPath] = route.split("#");
  const parts = parseRoute(rootPath);

  let view;

  // Top-level
  if (parts.length === 0) {
    view = <HomePage />;
  } else if (parts[0] === "competitions") {
    if (parts.length === 1) {
      view = <CompetitionsList />;
    } else {
      const slug = parts[1];
      const step = parts[2];
      if (step === "enter")         view = <EnterFlow slug={slug} />;
      else if (step === "tickets")   view = <EnterFlow slug={slug} />;
      else if (step === "skill")     view = <EnterFlow slug={slug} />;
      else if (step === "checkout")  view = <EnterFlow slug={slug} />;
      else                            view = <CompetitionDetail slug={slug} />;
    }
  } else if (parts[0] === "checkout") {
    if (parts[1] === "success")     view = <CheckoutSuccess />;
    else if (parts[1] === "cancel") view = <CheckoutCancel />;
    else                            view = <CheckoutCancel />;
  } else if (parts[0] === "how-it-works")        view = <HowItWorksPage />;
  else if (parts[0] === "faq")                   view = <FAQ />;
  else if (parts[0] === "about")                 view = <AboutPage />;
  else if (parts[0] === "contact")               view = <Contact />;
  else if (parts[0] === "winners")               view = <Winners />;
  else if (parts[0] === "login")                 view = <Login />;
  else if (parts[0] === "register")              view = <Register />;
  else if (parts[0] === "forgot-password")       view = <ForgotPassword />;
  else if (parts[0] === "reset-password")        view = <ResetPassword />;
  else if (parts[0] === "verify-email")          view = <VerifyEmail />;
  else if (parts[0] === "profile")               view = <Profile />;
  else if (parts[0] === "settings")              view = <Settings />;
  else if (parts[0] === "addresses")             view = <Addresses />;
  else if (parts[0] === "my-tickets")            view = <MyTickets />;
  else if (parts[0] === "my-wins")               view = <MyWins />;
  else if (parts[0] === "referrals")             view = <Referrals />;
  else if (parts[0] === "terms")                 view = <TermsPage />;
  else if (parts[0] === "privacy")               view = <PrivacyPage />;
  else if (parts[0] === "cookies")               view = <CookiesPage />;
  else if (parts[0] === "competition-rules")     view = <CompetitionRulesPage />;
  else view = (
    <section className="section" style={{ textAlign: "center", paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: 14 }}>Error 404</div>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 14 }}>Page not found</h1>
      <p style={{ color: "var(--ink-dim)", marginBottom: 28 }}>The page you're looking for doesn't exist or has been moved.</p>
      <a href="#/" className="btn btn-primary btn-xl">← Back home</a>
    </section>
  );

  return (
    <>
      <Nav />
      <main>{view}</main>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
