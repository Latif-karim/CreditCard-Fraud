# Fraud Detection Backend (Flask)

Starter backend for a credit card fraud detection application with:
- JWT authentication and roles (`admin`, `user`)
- Real-time transaction ingest endpoint
- Rule-based checks + behavior profiling + ML placeholder scoring
- Risk scoring (0-100) with decision reasons
- Dashboard metrics endpoints
- Alert and audit log stubs

## Quick Start

1. Create virtual environment and install dependencies.
2. Copy `.env.example` to `.env` and update secrets.
3. Initialize database:
   - `flask --app run db init`
   - `flask --app run db migrate -m "init"`
   - `flask --app run db upgrade`
4. Start server:
   - `python run.py`

## Key Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /transactions/ingest` (JWT)
- `GET /transactions/flagged` (JWT)
- `GET /dashboard/overview` (JWT admin)
- `GET /dashboard/fraud-vs-legit` (JWT)
- `GET /dashboard/trends` (JWT)
- `GET /dashboard/risk-distribution` (JWT)
- `GET /dashboard/top-locations` (JWT)
- `GET /dashboard/audit-logs` (JWT)

## ML Training And Persistence

Train against Kaggle `creditcard.csv` and persist best model:

- `python ml/train_model.py --dataset "C:\path\to\creditcard.csv"`

Artifacts are written to `ml/artifacts`:
- `fraud_model.joblib`
- `metrics.json`

The runtime inference in `app/fraud/model.py` auto-loads `fraud_model.joblib` if present.
If missing, the API falls back to heuristic scoring.

## Next Steps

- Add SMTP/SendGrid in `app/services/alerts.py`
- Add proper card/token storage strategy (never store CVV)
- Add tests for all scoring and auth flows



Download Dataset Here: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud

Paste Dataset into backend/ml/data directory