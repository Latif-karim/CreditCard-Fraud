# FraudShield — Final Year Project Defense Guide

## Project summary

**FraudShield** is a full-stack credit card fraud detection platform combining:

- **Rules engine** — deterministic policies (velocity, amount thresholds)
- **Machine learning** — calibrated fraud probability (scikit-learn)
- **Behavioral analytics** — profile drift and location anomalies
- **Explainability** — feature contributions for analyst review
- **RBAC** — cardholder, analyst, and administrator roles

**Stack:** Next.js 14 (frontend) · Flask + SQLite (backend) · JWT authentication

---

## Quick start (demo day)

### Terminal 1 — Backend

```powershell
cd backend
pip install -r requirements.txt
python -m flask --app run db upgrade
python run.py
```

### Terminal 2 — Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Demo accounts

| Role | Email | Password | What to show |
|------|-------|----------|--------------|
| **Admin** | `ops@fraudshield.demo` | `DemoPass123!` | User management, fraud rules, global KPIs |
| **Analyst** | `analyst@fraudshield.demo` | `DemoPass123!` | Monitoring, flagged queue, fraud lab, reports |
| **Cardholder** | `user@fraudshield.demo` | `DemoPass123!` | Personal overview, manual capture, explainability |

You can also **register** any role (including Administrator) from `/register`.

---

## Suggested defense flow (10–15 minutes)

1. **Landing page** — Problem statement, architecture highlights, product screenshot.
2. **Register** — Create an analyst account (shows RBAC at signup).
3. **Admin login** — Show user list, toggle a fraud rule, mention model retrain stub.
4. **Analyst login** — Start **Capture → Live stream** (30s auto transactions); show toast/sound alerts.
5. **Monitoring** — Filter flagged transactions; approve or flag an item.
6. **Fraud lab** — Run a synthetic high-risk transaction; discuss fused score.
7. **Explainability** — Open a transaction ID; walk through feature drivers.
8. **Reports** — Download CSV and PDF for auditors / examiners.
9. **Cardholder login** — Show scoped data (only own transactions).

---

## Replace the landing page screenshot

1. Log in and open the dashboard view you want to showcase.
2. Take a screenshot (recommended **1200×675** PNG).
3. Save as:

   `frontend/public/screenshots/dashboard-preview.png`

4. Refresh the home page — the **Product walkthrough** section updates automatically.

See also: `frontend/public/screenshots/README.md`

---

## Role capabilities (for examiners)

| Feature | Cardholder | Analyst | Admin |
|---------|:----------:|:-------:|:-----:|
| Personal overview & charts | ✓ (scoped) | ✓ (global) | ✓ |
| Manual transaction capture | ✓ (self) | ✓ (any user) | ✓ |
| Live 30s stream / simulator | — | ✓ | ✓ |
| Monitoring & flagged queue | — | ✓ | ✓ |
| Fraud lab & explainability | Explain own | ✓ | ✓ |
| Reports (CSV/PDF/JSON) | — | ✓ | ✓ |
| Admin console (users, rules) | — | — | ✓ |

---

## Architecture talking points

- **Ingest pipeline:** `POST /transactions/ingest` → rules + ML + behavior → persisted decision + audit log.
- **Security:** JWT in `localStorage`, session cookie for Next.js middleware, API enforces role scopes.
- **Explainability:** SHAP-style feature breakdown (educational approximation, not production SHAP).
- **Limitations (honest):** Demo data, stub email/2FA, no real payment network integration.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 on API calls | Sign out and sign in again; restart backend after config changes |
| Login 500 on `.demo` emails | Restart backend (LenientEmail validator) |
| PDF export fails | `pip install fpdf2` in backend venv |
| Git SSL error (Windows) | `git config --global http.sslBackend schannel` |

---

## Repository structure

```
cursorG/
├── backend/          Flask API, ML model, migrations
├── frontend/         Next.js dashboard & landing
├── DEFENSE.md        This guide
└── README.md         Setup & features overview
```

Good luck with your defense.
