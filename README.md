# FraudShield — Deep Learning Fraud Detection Platform

Real-time payment fraud scoring with a **hybrid deep learning ensemble** (1D-CNN classifier + autoencoder anomaly detector + live-feature scorer), rules engine, behavioral analytics, and a production-style fraud operations console.

Inspired by published research on European benchmark fraud detection (CNN architectures, autoencoder anomaly detection, and layered production defense) and operational patterns used at Visa, Mastercard, and PayPal.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Flask](https://img.shields.io/badge/Flask-API-green) ![DL](https://img.shields.io/badge/TensorFlow-Deep_Learning-blue)

## Features

- Landing page for **fraud analysts** and **administrators**
- JWT authentication with approval workflow (no cardholder self-service role)
- **Google & GitHub** social sign-in (optional; configure OAuth in `backend/.env`)
- **Hybrid deep learning scoring:**
  - **1D-CNN** supervised classifier on 31 PCA-style features (V1–V28 + derived)
  - **Autoencoder** unsupervised anomaly detection on legitimate traffic
  - **Live feature scorer** for runtime merchant/geo/device metadata
  - **Rules + behavioral** signals layered on top (production-style defense)
- Operations dashboard: KPIs, heatmaps, live monitoring, flagged queue
- Transaction ingest + continuous stream simulator
- Explainability panel with CNN/autoencoder/live-scorer attribution
- Alerts, reports (CSV, PDF, JSON), admin user/rule/model management
- Admin **model retrain** wired to `ml/train_model.py`

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
python ml/train_model.py --dataset ml/data/creditcard.csv
```

**Held-out test metrics (European benchmark):** ROC-AUC ~0.98 · PR-AUC ~0.69 · Recall ~0.89

## Reseed demo data

Clears all previous transactions and re-seeds ~80 rows through the **live scoring pipeline**:

```powershell
# CLI
cd backend
python -c "from app import create_app; from app.services.seed_data import reseed_realistic_demo_data; app=create_app();
with app.app_context(): print(reseed_realistic_demo_data(min_transactions=80))"

# Or via API (staff JWT)
POST /transactions/seed?force=true&min=80
```

## Social login (Google / GitHub)

1. Copy `backend/.env.example` to `backend/.env` and fill in OAuth client IDs/secrets.
2. **Google:** redirect URI `http://127.0.0.1:5000/auth/google/callback`
3. **GitHub:** callback `http://127.0.0.1:5000/auth/github/callback`

New social users receive a **pending analyst** workspace until an administrator approves access.

## Default accounts (development)

| Role | Email | Password |
|------|-------|----------|
| Admin | `ops@fraudshield.demo` | `DemoPass123!` |
| Analyst | `analyst@fraudshield.demo` | `DemoPass123!` |
| Analyst | `reviewer@fraudshield.demo` | `DemoPass123!` |

Change or disable these accounts before deploying to production.

## Documentation

| Document | Description |
|----------|-------------|
| **[FraudShield-Project-Documentation.docx](FraudShield-Project-Documentation.docx)** | Word report (submission format) |
| **[DOCUMENTATION.md](DOCUMENTATION.md)** | Markdown source for the report |
| **[backend/README.md](backend/README.md)** | API reference, ML pipeline, environment setup |

Regenerate diagrams and Word file after editing `DOCUMENTATION.md`:

```powershell
pip install python-docx matplotlib
python scripts/diagram_assets.py
python scripts/generate_documentation_docx.py
```

Add your own UI screenshots for Chapter 4: save PNGs to `scripts/doc_assets/screenshots/` (see `scripts/doc_assets/screenshots/README.md` for filenames), then run `python scripts/generate_documentation_docx.py`.

## Related research

This implementation draws on three guiding papers:

1. **Pumsirirat & Yan (2018)** — Auto-encoder + RBM unsupervised anomaly detection (IJACSA)
2. **Alarfaj et al. (2022)** — CNN architectures on European benchmark data (IEEE Access)
3. **Roy et al. (2018)** — Deep learning topology comparison for credit card fraud (UVA / IEEE)

## License

Proprietary / all rights reserved unless otherwise specified by your organization.
