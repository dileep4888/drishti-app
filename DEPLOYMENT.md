# DRISHTI — Full Deployment Guide

This connects all 3 pieces — **MySQL database → backend API → web dashboard**
— from your laptop onto free cloud hosting, so you get live URLs you can
demo from anywhere and share with judges.

Total cost: **₹0** (free tiers). Total time: ~30-40 minutes the first time.

---

## Overview — what connects to what

```
Vercel (dashboard)  --VITE_API_URL-->  Railway (backend)  --DATABASE_URL-->  Railway (MySQL)
https://drishti.vercel.app             https://drishti-backend.up.railway.app
```

Two environment variables are the glue:
- **`DATABASE_URL`** — tells the backend where the MySQL database lives
- **`VITE_API_URL`** — tells the dashboard where the backend lives

Everything else in the code already reads from these — you never hardcode a URL.

---

## Part 1 — Push code to GitHub

```bash
cd drishti-app
git init
git add .
git commit -m "Initial commit: backend + dashboard"
```
Create a new empty repo on github.com (no README/license, keep it empty), then:
```bash
git remote add origin https://github.com/<your-username>/drishti-app.git
git branch -M main
git push -u origin main
```

---

## Part 2 — Database (Railway MySQL)

1. Go to [railway.app](https://railway.app) → sign in with GitHub → **New Project**
2. Click **"Provision MySQL"**
3. Once it's up, click the MySQL service → **"Connect"** tab → copy the
   `MYSQL_URL` (looks like `mysql://root:pass@host.railway.internal:3306/railway`)
4. Change `mysql://` to `mysql+pymysql://` at the start — this is your `DATABASE_URL`.
   Keep this value, you'll paste it in Part 3.
5. Load the schema: click the MySQL service → **"Data"** tab → **"Query"**,
   open `db/schema.sql` from your project, copy its full contents, paste and run.
   (Alternative: use a desktop client like TablePlus/DBeaver with the connection
   details from the Connect tab, and run the .sql file from there.)

---

## Part 3 — Backend (Railway)

1. In the same Railway project → **New** → **GitHub Repo** → select `drishti-app`
2. It'll try to build the whole repo — tell it to only use the backend folder:
   Service **Settings** → **Root Directory** → set to `backend`
3. Go to the service's **Variables** tab, add:
   - `DATABASE_URL` = the value from Part 2, step 4
   - `SECRET_KEY` = any long random string (e.g. run `openssl rand -hex 32` locally and paste the output)
4. Railway auto-detects Python and uses the `Procfile` (already included) to start
   the server. Deploy will run automatically.
5. Once deployed, go to **Settings** → **Networking** → **Generate Domain**.
   You'll get a URL like `https://drishti-backend-production.up.railway.app`
   — **copy this**, you need it in Part 4.
6. Test it: open `<your-backend-url>/docs` in a browser — you should see the
   same Swagger docs page you saw on localhost. If it loads, the backend + DB
   are correctly connected.

---

## Part 4 — Dashboard (Vercel)

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub → **Add New Project**
2. Import your `drishti-app` repo
3. In the import settings: **Root Directory** → select `dashboard`
   (Vercel auto-detects Vite — framework preset should say "Vite")
4. Before deploying, expand **Environment Variables** and add:
   - `VITE_API_URL` = the backend URL from Part 3, step 5
     (e.g. `https://drishti-backend-production.up.railway.app`)
5. Click **Deploy**. In ~1-2 minutes you'll get a live link like
   `https://drishti-app.vercel.app`

---

## Part 5 — Test end-to-end

1. Open `<your-backend-url>/docs`, use `POST /auth/register` to create a user
   with `role: department_official`
2. Open `<your-dashboard-url>/login`, sign in with that same email/password
3. You should land on the dashboard and see the institute register

If login fails with a network error, it's almost always one of:
- `VITE_API_URL` in Vercel doesn't match the actual Railway backend URL exactly
  (check for trailing slashes — there shouldn't be one)
- The backend hasn't redeployed after you added the variable — trigger a
  redeploy from Railway's dashboard
- CORS — already set to allow all origins in `main.py`, so this shouldn't hit,
  but if it does, double check the backend is actually running (visit `/docs`)

---

## Redeploying after code changes

Both Railway and Vercel auto-deploy on every `git push` to `main` — so your
normal workflow becomes:
```bash
git add .
git commit -m "describe what changed"
git push
```
Both services pick it up within a minute or two. No manual redeploy needed.
