# DRISHTI Web Dashboard — Setup Guide

## 1. Install & run
```bash
cd dashboard
npm install
npm run dev
```
Opens at `http://localhost:5173`. Make sure the backend is running at `http://localhost:8000`
(see `backend/README.md`) — the login screen calls it directly.

## 2. Try it
1. First register a user via the backend's `/docs` page (role: `department_official`).
2. Log in on the dashboard with that email/password.
3. You'll land on the institute register — currently showing **mock data**
   (see the TODO comment in `src/pages/Dashboard.jsx`) so you can demo the UI
   before the real institute-list endpoint is built.

## What's built so far
- [x] Login (calls real backend `/auth/login`, stores JWT)
- [x] Dashboard shell — sidebar nav, summary cards, institute list with risk stamps
- [ ] Wire institute list to a real `GET /institutes` endpoint (next backend step)
- [ ] Live CCTV feed view (opens when "View live feed" is clicked)
- [ ] Risk flags page, VC call log page

## Design notes
Theme is an "inspection ledger" concept — navy for authority, paper background,
and risk shown as a rotated wax-stamp badge (`RiskStamp` component) instead of a
plain colored pill, since this is fundamentally a government inspection record.
