# Quantum Quarters — Client Payment Tracker

An internal tool for tracking real estate client payments and documents.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Supabase (Auth, DB, Storage) · Vercel

---

## Quick Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd quantum-quarters
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, run the entire contents of `schema.sql`
3. Go to **Authentication → Providers** and make sure Email is enabled
4. Go to **Authentication → Users** and create your first user (Add User button)

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your values from Supabase → Project Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the user you created in Supabase.

---

## Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B: Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add the three environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**

---

## Features

| Feature | Description |
|---|---|
| **Login** | Supabase email/password auth |
| **Dashboard** | Summary stats + recent payments table |
| **Clients** | Add, edit, delete, search clients |
| **Payments** | Record payments with method & status |
| **Documents** | Upload, download, delete files via Supabase Storage |
| **Client Profile** | Full client view with all payments + documents |
| **Settings** | Change account password |

## Database Tables

- `clients` — Client records
- `payments` — Payment history (linked to clients)
- `documents` — Uploaded files (linked to clients, optionally payments)

## Adding More Users

In Supabase → Authentication → Users → **Invite User** (or Add User).

---

## Environment Variables Reference

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
