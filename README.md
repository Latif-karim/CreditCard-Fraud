# FraudShield — Credit Card Fraud Detection Platform

Final-year project: real-time fraud scoring with rules, machine learning, behavioral analytics, and role-based operations console.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Flask](https://img.shields.io/badge/Flask-API-green) ![ML](https://img.shields.io/badge/scikit--learn-ML-blue)

## Features

- Landing page with product walkthrough and demo credentials
- JWT authentication with **cardholder**, **analyst**, and **admin** roles
- Operations dashboard: KPIs, charts, heatmaps, live activity
- Transaction capture (manual + 30s synthetic stream for staff)
- Flagged queue, fraud lab, AI explainability
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

## Demo login

| Role | Email | Password |
|------|-------|----------|
| Admin | `ops@fraudshield.demo` | `DemoPass123!` |
| Analyst | `analyst@fraudshield.demo` | `DemoPass123!` |
| Cardholder | `user@fraudshield.demo` | `DemoPass123!` |

## Custom landing screenshot

Save your dashboard capture as:

`frontend/public/screenshots/dashboard-preview.png`

## Defense presentation

See **[DEFENSE.md](./DEFENSE.md)** for a step-by-step demo script and examiner Q&A prompts.

## License

Academic / demonstration use.
