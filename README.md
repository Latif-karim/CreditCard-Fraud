# FraudShield — Credit Card Fraud Detection Platform

Real-time fraud scoring with rules, machine learning, behavioral analytics, and a role-based operations console.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Flask](https://img.shields.io/badge/Flask-API-green) ![ML](https://img.shields.io/badge/scikit--learn-ML-blue)

## Features

- Landing page with product overview
- JWT authentication with **cardholder**, **analyst**, and **admin** roles
- **Google & GitHub** social sign-in (optional; configure OAuth in backend `.env`)
- Operations dashboard: KPIs, charts, heatmaps, live activity
- Transaction capture (manual entry and continuous monitoring for staff)
- Flagged queue, risk analysis, explainability
- Alerts, reports (CSV, PDF, JSON), admin user/rule management
- Sound + toast notifications on new transactions

## Quick start

```powershell
# Backend
cd backend
pip install -r requirements.txt
python -m flask --app run db upgrade
python run.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- **App:** http://localhost:3000  
- **API:** http://127.0.0.1:5000  

## Social login (Google / GitHub)

1. Copy `backend/.env.example` to `backend/.env` and fill in OAuth client IDs/secrets.
2. **Google:** [Google Cloud Console](https://console.cloud.google.com/) → OAuth client → redirect URI  
   `http://127.0.0.1:5000/auth/google/callback`
3. **GitHub:** Settings → Developer settings → OAuth App → callback  
   `http://127.0.0.1:5000/auth/github/callback`
4. Restart the Flask API. Login/register pages show **Continue with Google/GitHub** when configured.

For local development on Windows, if OAuth SSL verification fails, set `OAUTH_SSL_VERIFY=false` in `backend/.env` (development only).

New social users receive the **cardholder** role. Existing accounts with the same email are linked automatically.

## Default accounts (development)

After running database migrations, these seeded accounts are available for local testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | `ops@fraudshield.demo` | `DemoPass123!` |
| Analyst | `analyst@fraudshield.demo` | `DemoPass123!` |
| Cardholder | `user@fraudshield.demo` | `DemoPass123!` |

Change or disable these accounts before deploying to production.

## Custom landing screenshot

Save your dashboard capture as:

`frontend/public/screenshots/dashboard-preview.png`

## Documentation

- **[DEFENSE.md](./DEFENSE.md)** — presentation guide and Q&A prompts (development/evaluation)
- **backend/README.md** — API reference

## License

Proprietary / all rights reserved unless otherwise specified by your organization.
