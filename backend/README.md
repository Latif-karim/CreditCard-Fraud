# Fraud Detection Backend (Flask)

Enterprise-style API for credit card fraud detection: JWT auth (roles **admin**, **analyst**), transaction ingest and monitoring, **hybrid deep learning scoring** (1D-CNN + autoencoder + live feature scorer), explainability, alerts, admin, reports, and audit trails.

## Quick start

1. Python 3.11+ recommended. Create a venv and install deps: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env`
3. Configure the database:

- **Local fallback:** leave `DATABASE_URL` empty to use SQLite.
- **Neon/PostgreSQL:** set `DATABASE_URL` in `backend/.env` to your Neon pooled connection string, including `sslmode=require`.
- Demo data auto-seeding is disabled by default for Neon/PostgreSQL. Set `AUTO_SEED_DEMO_DATA=true` only if you intentionally want startup seeding.

```bash
DATABASE_URL=<your-neon-pooled-postgresql-url>
```

4. Database migrations:

```bash
flask --app run db upgrade
```

5. Bootstrap or train ML models (see below), then run: `python run.py`

## Roles

- **admin** — user/rule management, model retrain, reseed, full audit exports
- **analyst** — dashboards, monitoring, fraud lab, explainability, ingest

Self-registration creates an access request (`approved=false`). The operations console remains locked until an administrator approves the account.

> The **cardholder** role was removed. FraudShield is an internal fraud-operations platform.

## Deep learning models

### Architecture

| Component | File | Purpose |
|-----------|------|---------|
| 1D-CNN classifier | `fraud_cnn.keras` | Supervised fraud probability on 31 features |
| Autoencoder | `fraud_autoencoder.keras` | Unsupervised anomaly on legitimate traffic |
| Feature scaler | `feature_scaler.joblib` | StandardScaler fit on training data |
| Metrics | `metrics.json` | ROC-AUC, PR-AUC, recall, precision |
| Manifest | `model_manifest.json` | Architecture metadata, AE threshold |

**Offline fusion:** `0.75 × CNN + 0.25 × autoencoder reconstruction score`

**Live runtime:** when proxy features diverge from Kaggle PCA space, `live_fraud_probability()` in `ml/features.py` provides calibrated scoring from merchant category, geo risk, amount, velocity, and user baseline.

### Bootstrap (no Kaggle file)

```bash
python ml/bootstrap_model.py
```

### Train on European benchmark

```bash
python ml/train_model.py --dataset ml/data/creditcard.csv
```

Dataset: [Kaggle Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) — place `creditcard.csv` under `backend/ml/data/`.

**Typical held-out metrics:** ROC-AUC ~0.98 · PR-AUC ~0.69 · Recall ~0.89 · Precision ~0.11

Artifacts are written to `ml/artifacts/`. Runtime loads Keras models in `app/fraud/model.py`. The legacy `fraud_model.joblib` (Random Forest) is no longer used.

### Scoring pipeline

```
final_score = MIN(100, rule_score + behavior_score + ml_score)
status      = "flagged" if final_score >= 60
confidence  = ml_probability (0–1)
```

| Layer | Max contribution | Source |
|-------|------------------|--------|
| Rules | ~30 | Amount, velocity, location mismatch |
| Behavior | ~30 | User avg spend, location history |
| ML | ~40 | CNN + AE hybrid or live feature scorer |

## Reseed database

Purges **all** previous transactions, fraud decisions, disputes, alerts, and notifications; re-seeds through the live ingest pipeline:

```bash
# CLI
python -c "from app import create_app; from app.services.seed_data import reseed_realistic_demo_data; app=create_app();
with app.app_context(): print(reseed_realistic_demo_data(min_transactions=80))"
```

```http
POST /transactions/seed?force=true&min=80
Authorization: Bearer <staff-jwt>
```

Each seeded transaction runs rules + behavior + ML scoring. Reseed takes several minutes (~80 ML inferences). Progress prints every 10 transactions.

## Auth

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/register` | `role` in `analyst` \| `admin`; requires approval |
| POST | `/auth/login` | Returns JWT + `role` |
| POST | `/auth/forgot-password` | OTP stored; in **debug**, response may include `dev_otp` |
| POST | `/auth/verify-otp` | `{ email, otp }` → `{ valid }` |
| POST | `/auth/reset-password` | `{ email, otp, new_password }` |
| GET | `/auth/me` | JWT — profile |
| GET | `/auth/google`, `/auth/github` | OAuth redirect |
| GET | `/auth/oauth/providers` | Which social providers are configured |

## Transactions

| Method | Path | Notes |
|--------|------|--------|
| POST | `/transactions/ingest` | Staff JWT; `user_id`, `amount`, `location`, optional merchant/geo/device |
| GET | `/transactions/flagged` | Last 100 flagged |
| GET | `/transactions/list` | Filters: `status`, `risk_min`, `q`, pagination |
| PATCH | `/transactions/<id>/action` | `{ action: flag \| approve \| safe \| freeze_account }` |
| POST | `/transactions/seed` | `?force=true` purges + reseeds; `?min=80` |
| GET | `/transactions/stream` | SSE live feed |
| POST | `/transactions/simulator/start` | `{ interval_seconds: 30 }` |
| POST | `/transactions/simulator/tick` | One synthetic transaction |

## Fraud & explainability

| Method | Path | Notes |
|--------|------|--------|
| POST | `/fraud/simulate` | Dry-run scoring; `persist: true` to save |
| GET | `/fraud/explain/<transaction_id>` | Feature attribution + decision breakdown |

Response includes `cnn_probability`, `autoencoder_score`, `ml_probability`, `model_family` (`deep_learning_hybrid` or `live_feature_scorer`).

## Dashboard (JWT; analyst/admin)

- `GET /dashboard/overview` — KPIs
- `GET /dashboard/trends`, `fraud-vs-legit`, `risk-distribution`, `top-locations`
- `GET /dashboard/fraud-by-region`, `fraud-by-card`
- `GET /dashboard/recent-transactions`, `live-activity`, `heatmap`, `model-metrics`
- `GET /dashboard/audit-logs`
- `GET /dashboard/rules` — **admin only**

## Admin (JWT **admin**)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/admin/users` | List users |
| PATCH | `/admin/users/<id>` | Update role, suspend |
| POST | `/admin/users/<id>/approve` | Approve access request |
| POST | `/admin/users/<id>/reject` | Reject access request |
| PATCH | `/admin/rules/<id>` | Toggle `FraudRule.enabled` |
| POST | `/admin/models/retrain` | Runs `ml/train_model.py`, reloads models |
| POST | `/admin/data/purge-transactions` | `{ "confirm": "DELETE_ALL_TRANSACTIONS" }` |
| POST | `/admin/data/reseed-realistic` | Purge + reseed |

## Reports

- `GET /reports/transactions.csv`
- `GET /reports/summary.json`
- `GET /reports/summary.pdf`
- `GET /reports/audit-export.json`

## Demo fraud attack (API)

```powershell
# Login
$login = Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:5000/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"analyst@fraudshield.demo","password":"DemoPass123!"}'

# Ingest suspicious transaction
$h = @{ Authorization = "Bearer $($login.access_token)" }
Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:5000/transactions/ingest" `
  -Headers $h -ContentType "application/json" `
  -Body '{"user_id":1,"amount":6500,"location":"Lagos","country":"NG","merchant":"Binance","merchant_category":"crypto"}'
```

Expected: `status=flagged`, `risk_score>=60`, varied `confidence` (not a flat 25%).

## Next steps (production)

- SMTP / SendGrid for real email alerts
- SHAP / LIME wired to `fraud/explain`
- Redis for rate limits and streaming ingestion
- Sequence models (LSTM/GRU) for velocity patterns
- Never store PAN/CVV; tokenize cards

## Full documentation

See **[DOCUMENTATION.md](../DOCUMENTATION.md)** for the complete project report including related works, methodology, and test results.
