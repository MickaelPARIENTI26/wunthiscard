// Competition flow — list, detail (with embedded Step 1), enter flow (Steps 2-3)
const { useState: _uS1, useEffect: _uE1, useMemo: _uM1 } = React;

const BONUS_FOR = (n) => n >= 50 ? 10 : n >= 25 ? 4 : n >= 10 ? 2 : 0;

function readDraft(slug) {
  try { return JSON.parse(sessionStorage.getItem("wuc-draft-" + slug) || "{}"); }
  catch { return {}; }
}
function writeDraft(slug, data) {
  sessionStorage.setItem("wuc-draft-" + slug, JSON.stringify(data));
}

function CompetitionsList() {
  const list = window.WUC.competitions;
  const [filter, setFilter] = _uS1("All");
  const games = ["All", ...Array.from(new Set(list.map(c => c.game)))];
  const filtered = filter === "All" ? list : list.filter(c => c.game === filter);
  return (
    <>
      <PageHeader eyebrow="Prize Draws" title="All Competitions" subtitle="Browse all our live and upcoming competitions. Tickets from £2.99." />
      <section className="section section-gray">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {games.map(g => (
              <button key={g} onClick={() => setFilter(g)} className={`strip-chip ${filter === g ? "green" : ""}`} style={{ cursor: "pointer" }}>{g}</button>
            ))}
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-dim)" }}>
            Showing {filtered.length} of {list.length}
          </span>
        </div>
        <div className="comp-grid">
          {filtered.map((c, i) => <CompCard key={i} c={c} />)}
        </div>
      </section>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPETITION DETAIL — ticket picker (Step 1) lives inline on the right.
   User picks qty + pick method here, then "Enter now" goes to Step 2 (skill Q).
   ──────────────────────────────────────────────────────────── */
function CompetitionDetail({ slug }) {
  const c = window.WUC.competitions.find(x => x.slug === slug);
  if (!c) return <div className="section">Competition not found. <a href="#/competitions">Back →</a></div>;

  const totalTickets = parseInt(c.total.replace(/,/g, ""));
  const pct = Math.round((c.sold / totalTickets) * 100);
  const drawDate = (c.details.find(d => /draw|date/i.test(d.k)) || {}).v || "";
  const psa = (c.details.find(d => /grad/i.test(d.k)) || {}).v || "PSA 10";
  const leftTickets = parseInt(c.left.replace(/,/g, ""));
  const price = parseFloat(c.ticket.replace("£", ""));

  const draft = readDraft(slug);
  const [qty, setQty] = _uS1(draft.qty || 1);
  const [pickMethod, setPickMethod] = _uS1(draft.pickMethod || "auto");
  const bonus = BONUS_FOR(qty);
  const total = (qty * price).toFixed(2);

  _uE1(() => { writeDraft(slug, { qty, pickMethod }); }, [qty, pickMethod]);

  return (
    <>
      <div className="comp-back">
        <a href="#/competitions" className="back-link">← Back to Competitions</a>
      </div>

      {/* HERO: card visual + info/ticket picker */}
      <section className="comp-hero">
        <div className="comp-hero-grid">
          {/* card visual */}
          <div className="comp-hero-visual">
            <div className={`comp-hero-frame game-${c.game.toLowerCase().replace(" ", "-")}`}>
              <div className="comp-hero-marquee">
                ★ LIVE DRAW · {c.game.toUpperCase()} · LIVE DRAW · {c.game.toUpperCase()} · LIVE DRAW ★
              </div>
              <div className="comp-hero-imgwrap">
                <img src={c.img} alt={c.title} className="comp-hero-img" />
              </div>
              <div className="comp-hero-badges">
                <span className={`comp-game ${c.game.toLowerCase().replace(" ", "-")}`} style={{ position: "static" }}>{c.game}</span>
                <span className="comp-hero-psa">{psa}</span>
              </div>
            </div>

            {/* Beneath the card: description + compact stats */}
            <div className="comp-hero-meta-card">
              <p className="comp-desc" style={{ marginBottom: 18 }}>{c.description}</p>
              <div className="comp-stats-mini">
                <div>
                  <div className="comp-value-label">Card value</div>
                  <div className="comp-stats-mini-v">{c.value}</div>
                </div>
                <div>
                  <div className="comp-value-label">Participants</div>
                  <div className="comp-stats-mini-v">{c.sold.toLocaleString()}</div>
                </div>
                <div>
                  <div className="comp-value-label">Per ticket</div>
                  <div className="comp-stats-mini-v">{c.ticket}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: title, countdown, embedded Step 01 ticket picker */}
          <div className="comp-hero-info">
            <div className="hero-eyebrow" style={{ marginBottom: 14 }}>
              <span className="live-dot"/> {c.status === "Open" ? "LIVE NOW" : "COMING SOON"} · #WUC-{String(c.sold).padStart(5, "0")}
            </div>
            <h1 className="comp-title">{c.title}</h1>

            {/* Progress + countdown combined */}
            <div className="comp-progress-combo">
              <div className="comp-progress-head">
                <span>
                  <b style={{ fontFamily: "var(--display)", fontSize: 22, letterSpacing: "-0.02em" }}>{c.left}</b>
                  <span style={{ color: "var(--ink-dim)", fontSize: 13, marginLeft: 6 }}>/ {c.total} tickets left</span>
                </span>
                <span className="comp-progress-pct">{pct}% sold</span>
              </div>
              <div className="comp-hero-bar"><div className="comp-hero-bar-fill" style={{ width: Math.max(pct, 3) + "%" }} /></div>
              <div className="comp-progress-end">
                <span className="comp-progress-end-l">Draw ends in</span>
                <span className="comp-progress-end-v"><Countdown iso={c.endIso} /></span>
                <span className="comp-progress-end-d">· {drawDate}</span>
              </div>
            </div>

            {/* STEP 01 INLINE — ticket picker */}
            {c.status === "Open" ? (
              <div className="inline-step">
                <div className="inline-step-head">
                  <span className="inline-step-num">01</span>
                  <div>
                    <div className="step-kicker">Pick your tickets</div>
                    <h3 className="inline-step-title">How many do you want?</h3>
                  </div>
                </div>

                <div className="qty-grid qty-grid-6">
                  {[1, 5, 10, 25, 50, 100].map(b => {
                    const bb = BONUS_FOR(b);
                    const active = qty === b;
                    return (
                      <button key={b} onClick={() => setQty(b)} className={`qty-tile ${active ? "active" : ""}`}>
                        <div className="qty-tile-num">{b}</div>
                        <div className="qty-tile-label">ticket{b > 1 ? "s" : ""}</div>
                        {bb > 0 && <div className="qty-tile-bonus">+{bb}</div>}
                        <div className="qty-tile-price">£{(b * price).toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="qty-custom" style={{ marginBottom: 14 }}>
                  <span className="qty-custom-label">Custom</span>
                  <div className="qty-stepper">
                    <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                    <input type="number" value={qty} onChange={e => setQty(Math.max(1, Math.min(leftTickets, parseInt(e.target.value) || 1)))} min={1} max={leftTickets} />
                    <button onClick={() => setQty(Math.min(leftTickets, qty + 1))}>+</button>
                  </div>
                  <span className="qty-custom-max">Max {c.left}{bonus > 0 ? ` · +${bonus} bonus` : ""}</span>
                </div>

                <div className="qty-pick-options">
                  <label className={`qty-pick-opt ${pickMethod === "auto" ? "active" : ""}`}>
                    <input type="radio" checked={pickMethod === "auto"} onChange={() => setPickMethod("auto")} />
                    <div>
                      <b>⚡  Auto-pick</b>
                      <span>Instant · random</span>
                    </div>
                  </label>
                  <label className={`qty-pick-opt ${pickMethod === "manual" ? "active" : ""}`}>
                    <input type="radio" checked={pickMethod === "manual"} onChange={() => setPickMethod("manual")} />
                    <div>
                      <b>✎  Pick your own</b>
                      <span>Choose numbers</span>
                    </div>
                  </label>
                </div>

                <div className="inline-step-cta">
                  <div className="inline-step-summary">
                    <span>{qty} ticket{qty > 1 ? "s" : ""}{bonus > 0 ? ` + ${bonus} bonus` : ""}</span>
                    <b>£{total}</b>
                  </div>
                  <a href={`#/competitions/${slug}/enter`} className="btn btn-hot btn-xl btn-block">Enter now · £{total} →</a>
                </div>

                <div className="comp-meta-row">
                  <span>🔒 Secure checkout</span>
                  <span>✉ Free postal entry</span>
                  <span>📺 Live TikTok draw</span>
                </div>
              </div>
            ) : (
              <button className="btn btn-mute btn-xl btn-block" style={{ marginTop: 18 }}>Coming soon</button>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT THIS CARD */}
      <section className="section section-gray">
        <div className="section-head" style={{ marginBottom: 32 }}>
          <div>
            <div className="section-eyebrow">About the Card</div>
            <h2 className="section-title">What you'll be <span className="u">winning</span>.</h2>
          </div>
          <p className="section-sub">Everything graded, authenticated, and ready to ship to your door.</p>
        </div>
        <div className="comp-about-wrap">
          <div className="comp-about-grid">
            <div>
              <ul className="about-card-details">
                {c.details.map((d, i) => (
                  <li key={i}>
                    <span className="about-card-k">{d.k}</span>
                    <span className="about-card-v">{d.v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="postal-card">
              <div className="postal-kicker">Free postal entry</div>
              <p>Send a handwritten postcard with your name, email, and answer to the skill question:</p>
              <div className="postal-addr">
                WinUCard Ltd — Free Entry<br/>
                Unit 14 Skyline House<br/>
                200 Union St<br/>
                London SE1 0LX
              </div>
              <span className="postal-note">One entry per person per comp · Full <a href="#/competition-rules">rules</a></span>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   ENTER FLOW — Steps 2 (skill Q) and 3 (billing). Qty comes from draft.
   ──────────────────────────────────────────────────────────── */
function EnterFlow({ slug }) {
  const c = window.WUC.competitions.find(x => x.slug === slug);
  if (!c) return <div className="section">Competition not found. <a href="#/competitions">Back →</a></div>;

  const draft = readDraft(slug);
  const qty = draft.qty || 1;
  const pickMethod = draft.pickMethod || "auto";
  const price = parseFloat(c.ticket.replace("£", ""));
  const bonus = BONUS_FOR(qty);
  const total = (qty * price).toFixed(2);
  const correct = c.question.answer;
  const letters = ["A", "B", "C", "D"];

  const [step, setStep] = _uS1(1);            // 1 = skill, 2 = billing
  const [pick, setPick] = _uS1(null);
  const [submitted, setSubmitted] = _uS1(false);
  const [attempts, setAttempts] = _uS1(3);
  const [confirmed, setConfirmed] = _uS1(false);

  const submitAnswer = () => {
    if (pick === null) return;
    setSubmitted(true);
    if (pick === correct) setTimeout(() => setStep(2), 500);
    else setAttempts(a => a - 1);
  };
  const tryAgain = () => { setSubmitted(false); setPick(null); };
  const submitOrder = () => setConfirmed(true);

  if (confirmed) {
    return (
      <section className="section" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", paddingTop: 80 }}>
        <div className="hero-eyebrow" style={{ justifyContent: "center" }}><span className="live-dot"/> ENTRY CONFIRMED</div>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 72, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 0.95, margin: "24px 0" }}>You're <span className="chip">in</span>.</h1>
        <p style={{ color: "var(--ink-dim)", fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>
          Confirmation sent to your email. Tune in to the live draw on TikTok when the countdown hits zero.
        </p>
        <div className="card" style={{ textAlign: "left", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed var(--line-2)" }}><span style={{ color: "var(--ink-dim)" }}>Competition</span><b>{c.title}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed var(--line-2)" }}><span style={{ color: "var(--ink-dim)" }}>Tickets</span><b>{qty}{bonus > 0 ? ` + ${bonus} bonus` : ""}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed var(--line-2)" }}><span style={{ color: "var(--ink-dim)" }}>Pick method</span><b style={{ textTransform: "capitalize" }}>{pickMethod}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}><span style={{ color: "var(--ink-dim)" }}>Total paid</span><b>£{total}</b></div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#/my-tickets" className="btn btn-primary btn-xl">View my tickets →</a>
          <a href="#/competitions" className="btn btn-ghost btn-xl">Browse more</a>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="comp-back">
        <a href={`#/competitions/${slug}`} className="back-link">← Back to Competition</a>
      </div>

      {/* Compact hero: card + title + step tracker (Step 1 shown as DONE) */}
      <section className="enter-head">
        <div className="enter-head-card">
          <img src={c.img} alt={c.title} />
        </div>
        <div className="enter-head-body">
          <div className="enter-head-kicker">Enter · {c.game}</div>
          <h1 className="enter-head-title">{c.title}</h1>
          <div className="enter-head-meta">
            <span><b>{qty} ticket{qty > 1 ? "s" : ""}</b>{bonus > 0 ? ` +${bonus} bonus` : ""}</span>
            <span>·</span>
            <span style={{ textTransform: "capitalize" }}>{pickMethod} pick</span>
            <span>·</span>
            <span>Total <b>£{total}</b></span>
          </div>
        </div>
        <div className="enter-tracker">
          {[
            { n: 1, t: "Tickets" },
            { n: 2, t: "Skill Q" },
            { n: 3, t: "Details" }
          ].map((s, i) => {
            // Step 1 is always done (picked on comp page). step state here: 1=skill=tracker2, 2=billing=tracker3
            const trackerStep = s.n;
            const uiStep = step + 1;
            const done = trackerStep < uiStep;
            const active = trackerStep === uiStep;
            return (
              <div key={i} className={`enter-tracker-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
                <span className="enter-tracker-num">{done ? "✓" : trackerStep}</span>
                <span className="enter-tracker-t">{s.t}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* STEP 2 — Skill Q */}
      {step === 1 && (
        <section className="enter-step enter-step-live">
          <div className="enter-step-head">
            <span className="step-num" style={{ background: "var(--warn)" }}>02</span>
            <div>
              <div className="step-kicker">Step 02 · Skill question</div>
              <h2 className="step-title">Answer correctly to validate your entry.</h2>
            </div>
            <a href={`#/competitions/${slug}`} className="btn btn-ghost">← Change tickets</a>
          </div>

          <div className="skill-prompt">
            <span className="skill-prompt-icon">?</span>
            <p>{c.question.q}</p>
          </div>

          <div className="skill-opts">
            {c.question.options.map((opt, i) => {
              const selected = pick === i;
              const isCorrect = submitted && i === correct;
              const isWrong = submitted && selected && i !== correct;
              const state = isCorrect ? "correct" : isWrong ? "wrong" : selected ? "selected" : "";
              const locked = submitted && pick === correct;
              return (
                <button key={i} onClick={() => !locked && setPick(i)} className={`skill-opt ${state}`} disabled={locked}>
                  <span className="skill-letter">{letters[i]}</span>
                  <span className="skill-text">{opt}</span>
                  {isCorrect && <span className="skill-check">✓</span>}
                  {isWrong && <span className="skill-check">✕</span>}
                </button>
              );
            })}
          </div>

          <div className="enter-step-foot">
            <span className="skill-hint">UK law · 3 attempts · fair trivia about the card</span>
            {!submitted ? (
              <button onClick={submitAnswer} disabled={pick === null} className={`btn ${pick === null ? "btn-mute" : "btn-hot"} btn-xl`}>
                Submit answer →
              </button>
            ) : pick === correct ? (
              <span className="skill-ok-lg">✓ Correct — taking you to details…</span>
            ) : attempts > 0 ? (
              <button onClick={tryAgain} className="btn btn-primary btn-xl">Try again · {attempts} left →</button>
            ) : (
              <a href={`#/competitions/${slug}`} className="btn btn-ghost btn-xl">No attempts left · Back to comp</a>
            )}
          </div>
        </section>
      )}

      {/* STEP 3 — Billing */}
      {step === 2 && (
        <section className="enter-step enter-step-live">
          <div className="enter-step-head">
            <span className="step-num" style={{ background: "var(--pop)", color: "#fff" }}>03</span>
            <div>
              <div className="step-kicker">Step 03 · Your details</div>
              <h2 className="step-title">Where do we send your win?</h2>
            </div>
            <button onClick={() => { setStep(1); setSubmitted(false); setPick(null); }} className="btn btn-ghost">← Back</button>
          </div>

          <div className="billing-grid">
            <div className="field"><label className="field-label">First name</label><input className="input" /></div>
            <div className="field"><label className="field-label">Last name</label><input className="input" /></div>
            <div className="field billing-full"><label className="field-label">Email</label><input type="email" className="input" placeholder="you@domain.com" /></div>
            <div className="field"><label className="field-label">Phone</label>
              <div className="phone-row">
                <div className="phone-cc">🇬🇧 +44</div>
                <input className="input" />
              </div>
            </div>
            <div className="field"><label className="field-label">Country</label>
              <select className="select"><option>United Kingdom</option><option>Ireland</option><option>France</option></select>
            </div>
            <div className="field billing-full"><label className="field-label">Address</label><input className="input" placeholder="Flat / house · street" /></div>
            <div className="field"><label className="field-label">City</label><input className="input" /></div>
            <div className="field"><label className="field-label">Postcode</label><input className="input" /></div>
          </div>

          <div className="billing-checks">
            <label className="check-row">
              <input type="checkbox" className="checkbox" defaultChecked />
              <span>I confirm I am at least <b>18 years old</b>.</span>
            </label>
            <label className="check-row">
              <input type="checkbox" className="checkbox" defaultChecked />
              <span>I've read and agree to the <a href="#/terms">terms</a> and <a href="#/competition-rules">competition rules</a>, including the non-refundable ticket policy.</span>
            </label>
            <label className="check-row">
              <input type="checkbox" className="checkbox" defaultChecked />
              <span>Email me draw updates and new drops.</span>
            </label>
          </div>

          <div className="enter-pay-panel">
            <div className="enter-pay-total">
              <span>Total</span>
              <b>£{total}</b>
            </div>
            <div className="enter-pay-chips">
              <span>🔒 Pay with</span>
              <span className="pay-chip">Apple Pay</span>
              <span className="pay-chip">Google Pay</span>
              <span className="pay-chip">Card</span>
            </div>
          </div>

          <div className="enter-step-foot">
            <span className="skill-hint">You'll receive confirmation by email immediately.</span>
            <button onClick={submitOrder} className="btn btn-hot btn-xl">Complete entry · £{total} →</button>
          </div>
        </section>
      )}
    </>
  );
}

function CheckoutSuccess() {
  return (
    <section className="section" style={{ textAlign: "center", maxWidth: 700, margin: "0 auto", paddingTop: 80 }}>
      <div className="hero-eyebrow" style={{ justifyContent: "center" }}><span className="live-dot"/> ENTRY CONFIRMED</div>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 64, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 0.95, margin: "20px 0" }}>You're <span className="chip">in</span>.</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>Check your email for confirmation and ticket numbers.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <a href="#/my-tickets" className="btn btn-primary btn-xl">View my tickets →</a>
        <a href="#/competitions" className="btn btn-ghost btn-xl">Browse more</a>
      </div>
    </section>
  );
}

function CheckoutCancel() {
  return (
    <section className="section" style={{ textAlign: "center", maxWidth: 700, margin: "0 auto", paddingTop: 80 }}>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 60, fontWeight: 700, letterSpacing: "-0.045em", margin: "20px 0" }}>Payment <span className="u">cancelled</span>.</h1>
      <p style={{ color: "var(--ink-dim)", fontSize: 17, lineHeight: 1.6, marginBottom: 32 }}>You haven't been charged. Try again or browse other competitions.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <a href="#/competitions" className="btn btn-primary btn-xl">Browse competitions</a>
        <a href="#/contact" className="btn btn-ghost btn-xl">Contact support</a>
      </div>
    </section>
  );
}

window.CompetitionsList = CompetitionsList;
window.CompetitionDetail = CompetitionDetail;
window.EnterFlow = EnterFlow;
window.CheckoutSuccess = CheckoutSuccess;
window.CheckoutCancel = CheckoutCancel;
window.TicketSelection = EnterFlow;
window.SkillQuestion = EnterFlow;
window.Checkout = EnterFlow;
