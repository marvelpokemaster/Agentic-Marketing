# Production Deployment Guide

This document describes how to deploy the **Agentic Marketing Lead Engine** to production.

## Architecture Overview
- **Frontend**: Next.js (Standalone build mode) deployed to **Vercel** or **Firebase App Hosting**.
- **Backend**: FastAPI web app (Chromium/Playwright scraping layer) deployed to **Cloud Run** or **Railway** (runs via Docker container).
- **Database**: **Firebase Data Connect** + **Cloud SQL** PostgreSQL database.

---

## 1. Database Setup (Firebase Data Connect)

### A. Deploy the Data Connect Schema
Apply the authoritative schema file to your Firebase project, which will provision the Cloud SQL instance automatically:
1. Initialize a Firebase project if you haven't already (`firebase init`).
2. Run `firebase deploy --only dataconnect`.
3. This creates the underlying PostgreSQL database and compiles the queries in `dataconnect/connector/`.

### B. Create the Storage Bucket
1. Open the Firebase Console and navigate to **Storage**.
2. Initialize Firebase Storage.
3. Deploy the storage security rules: `firebase deploy --only storage`.

---

## 2. Backend Deployment (Railway or Cloud Run)

The backend is configured to build automatically via Docker.

### A. Deployment Configuration
The deployment configuration is defined in `railway.json`:
- Build Target: `docker/backend.Dockerfile`
- Liveness/Health Probe: `GET /health` (timeouts: 120s)
- Restart Policy: `ON_FAILURE`

### B. Required Environment Variables on Railway
Configure the following variables in the Railway service settings:

| Variable Name | Description | Example Value |
|---|---|---|
| `DATABASE_URL` | Cloud SQL PostgreSQL connection string | `postgresql://postgres:[password]@[host]:5432/postgres` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account email | `firebase-adminsdk-...@...` |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key | `-----BEGIN PRIVATE KEY-----\n...` |
| `AI_PROVIDER` | AI provider for ad-copy and marketing content generation | `gemini` (or `openai` / `anthropic`) |
| `AI_PROVIDER_API_KEY` | API key for the AI provider | `AIzaSy...` (Gemini API key) |
| `AI_MODEL` | AI Model override (Optional) | `gemini-2.5-flash` |
| `CREATIVE_PROVIDER` | Ad-image generator provider | `pollinations` (free, no API key required) |
| `META_GRAPH_VERSION` | Version of Meta Graph API | `v21.0` |
| `META_ACCESS_TOKEN` | Meta page publishing access token | `EAAMj...` |
| `META_PAGE_ID` | Facebook page ID to publish onto | `1210131325510853` |
| `META_IG_USER_ID` | Instagram Business account user ID | `27447444248208916` |
| `INSTAGRAM_ACCESS_TOKEN`| Instagram access token | `IGAAO...` |

---

## 3. Frontend Deployment (Vercel)

Vercel compiles the frontend using Next.js standalone build optimizations.

### A. Deployment Configuration
The deployment configuration is defined in `apps/web/vercel.json`.
Set the **Root Directory** setting on Vercel to `apps/web`.

### B. Required Environment Variables on Vercel
Configure these variables in Vercel project settings:

| Variable Name | Description | Example Value |
|---|---|---|
| `DATABASE_URL` | Cloud SQL direct connection string (if using raw SQL) | `postgresql://postgres:[password]@[host]...` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account email | `firebase-adminsdk-...@...` |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key | `-----BEGIN PRIVATE KEY-----\n...` |
| `BACKEND_API_URL` | Public HTTP URL of your deployed Railway Backend | `https://agentic-marketing-production.up.railway.app` |
| `NEXT_PUBLIC_APP_URL` | Public HTTP URL of your Vercel Frontend app | `https://agentic-marketing.vercel.app` |

---

## 4. End-to-End Local Verification (Docker Compose)

Verify the full stack locally:
```bash
# 1. Start the Docker containers using compose
docker compose --env-file .env -f docker/docker-compose.yml up --build

# 2. Access the frontend app
# Navigate to: http://localhost:3000

# 3. Access backend health checks
# Navigate to: http://localhost:8000/health
```
