# FraudShield — Deep Learning Fraud Detection Platform

Real-time payment fraud scoring with a **hybrid deep learning ensemble** (1D-CNN classifier + autoencoder anomaly detector), rules engine, behavioral analytics, and a production-style fraud operations console.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Flask](https://img.shields.io/badge/Flask-API-green) ![DL](https://img.shields.io/badge/TensorFlow-Deep_Learning-blue)

## Features

- Landing page with platform metrics and product overview
- JWT authentication with **fraud analyst** and **administrator** roles (approval workflow)
- **Google & GitHub** social sign-in (optional; configure OAuth in backend `.env`)
- Deep learning scoring inspired by published fraud detection research:
  - **1D-CNN** supervised classifier on PCA-style transaction features
  - **Autoencoder** unsupervised anomaly detection on legitimate traffic
  - **Hybrid fusion** blended with rules + behavioral signals (Visa/Mastercard-style layered defense)
- Operations dashboard: KPIs, heatmaps, live monitoring, flagged queue
- Transaction ingest + continuous stream simulator
- Explainability panel with CNN/autoencoder attribution
- Alerts, reports (CSV, PDF, JSON), admin user/rule/model management
- Admin **model retrain** endpoint wired to `ml/train_model.py`

## Quick start

```powershell
# Backend
cd backend
pip install -r requirements.txt
python ml/bootstrap_model.py
python -m flask --app run db upgrade
python run.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- **App:** http://localhost:3000  
- **API:** http://127.0.0.1:5000  

## Train on real Kaggle data

```powershell
cd backend
python ml/train_model.py --dataset path/to/creditcard.csv
```

## Social login (Google / GitHub)

1. Copy `backend/.env.example` to `backend/.env` and fill in OAuth client IDs/secrets.
2. **Google:** [Google Cloud Console](https://console.google.com/) → OAuth client → redirect URI  
   `http://127.0.0.1:5000/auth/google/callback`
3. **GitHub:** Settings → Developer settings → OAuth App → callback  
   `http://127.0.0.1:5000/auth/github/callback`

New social users receive a **pending analyst** workspace until an administrator approves access.

## Default accounts (development)

| Role | Email | Password |
|------|-------|----------|
| Admin | `ops@fraudshield.demo` | `DemoPass123!` |
| Analyst | `analyst@fraudshield.demo` | `DemoPass123!` |
| Analyst | `reviewer@fraudshield.demo` | `DemoPass123!` |

Change or disable these accounts before deploying to production.

## Documentation

- **backend/README.md** — API reference

## License

Proprietary / all rights reserved unless otherwise specified by your organization.
