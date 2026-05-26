# Fraud Detection Frontend (Next.js)

Starter frontend for a credit card fraud monitoring platform.

## Included

- Landing page and login page
- Tailwind CSS setup for all UI styling
- Admin overview dashboard with KPI cards (live API data)
- Fraud vs legit trend chart (Chart.js, live API data)
- Flagged transactions table page
- Analytics page (risk distribution + top locations)
- API helper layer for Flask backend integration

## Quick Start

1. Install dependencies:
   - `npm install`
2. Copy `.env.local.example` to `.env.local`.
   - Default API: `NEXT_PUBLIC_API_BASE=http://127.0.0.1:5000`
3. Start dev server:
   - `npm run dev`

## Pages

- `/` home
- `/login`
- `/dashboard`
- `/dashboard/transactions`
- `/dashboard/analytics`
