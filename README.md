<div align="center">

# ⚡ SmartVenue AI
### Real-Time Crowd Intelligence Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-Deployed-4285F4?style=flat-square&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)

**Smarter Venues, Zero Queues.**

*Monitor density · Predict queues · Broadcast alerts — all in real time*

</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Live Demo](#-live-demo)
3. [Core Features](#-core-features)
4. [Tech Stack](#-tech-stack)
5. [Architecture](#-architecture)
6. [Project Structure](#-project-structure)
7. [Screenshots](#-screenshots)
8. [Quick Start (Local)](#-quick-start-local)
9. [Environment Variables](#-environment-variables)
10. [Docker Deployment](#-docker-deployment)
11. [Google Cloud Run Deployment](#-google-cloud-run-deployment)
12. [API Reference](#-api-reference)
13. [Demo Credentials](#-demo-credentials)
14. [Future Scope](#-future-scope)

---

## 🎯 Overview

**SmartVenue AI** is a production-grade, full-stack crowd intelligence platform built for large-scale event management. It uses real-time simulation driven by queuing theory (M/M/1 model) to monitor crowd density across venue sectors, predict bottlenecks before they form, and empower administrators to respond instantly.

The platform is purpose-built for the challenge of modern event safety — where seconds matter, and crowd surges can turn catastrophic without early warning.

> Built for the **PromptWars Hackathon** — architected to production standards with JWT authentication, role-based access, comprehensive security hardening, containerized deployment, and a zero-external-dependency database strategy.

### Key Stats

| Metric | Value |
|--------|-------|
| Real-time update interval | **3 seconds** |
| Venue sectors monitored | **12 sectors** (A1–C4) |
| Queue prediction model | **M/M/1 queuing theory** |
| Prediction horizon | **15 minutes ahead** |
| AI insight categories | **4** (critical, warning, info, success) |
| Authentication | **JWT + bcrypt (cost factor 12)** |

---

## 🌐 Live Demo

> *(Replace with your deployed URL after Cloud Run deployment)*

```
Frontend : https://smartvenue-frontend-xxxxx-uc.a.run.app
Backend  : https://smartvenue-backend-xxxxx-uc.a.run.app
```

---

## ✨ Core Features

### 📡 Real-Time Sector Heatmap
- **12 venue sectors** (Entry Gates, Main Stage, Food Court, Entertainment, Restrooms, VIP, Exit) updated every 3 seconds via WebSocket
- Color-coded density indicators: 🟢 Low → 🟡 Medium → 🔴 High
- **Pulsing animation** on critical sectors (>75% capacity) for instant visual alerting
- Dashed border overlay marks the **AI-recommended safe path** through the venue
- **Predictive trend arrows** (↑/↓) show each sector's 15-minute trajectory

### 🧠 AI Queue Prediction Engine
- Implements the **M/M/1 queuing model** (Kendall notation) to derive realistic wait times
- Continuously updates wait estimates for 5 facilities: Main Gate, Food Court, Restrooms, VIP Entrance, Main Stage
- Color-coded wait time bars animate smoothly as conditions change
- Factors in time-of-day crowd patterns: pre-event trickle → morning build-up → peak hours → evening wind-down

### 📊 15-Minute Predictive Radar Chart
- **Recharts RadarChart** overlays current density vs. 15-minute forecast simultaneously
- Uses a momentum-based density propagation model with mean-reversion dampening
- Allows staff to pre-position resources before bottlenecks materialise

### 🗺️ Smart Navigation (Safe Path Routing)
- Dynamically computes the **3 lowest-density sectors** as the recommended attendee route
- Updates automatically as conditions change — no static maps
- Displayed both on the heatmap (dashed overlay) and in the top KPI bar

### 🚨 Admin Emergency Broadcast
- Real-time **Socket.IO push alerts** dispatched to all connected clients instantly
- Alert log with timestamps for audit trail (last 8 alerts)
- Live alert banner appears on all user dashboards simultaneously with animation

### 📈 Admin Analytics Dashboard
- **Live Crowd Density Flow**: rolling area chart of last 20 occupancy readings
- **Zone-wise Traffic Comparison**: horizontal bar chart aggregated by zone type
- **Peak Time Prediction**: line chart overlaying expected vs. actual crowd patterns
- **Queue Wait Trends**: multi-line time-series for all facilities simultaneously
- **Facility Wait Time Metrics**: detailed table with status badges

### 🔐 Production-Grade Security
- **JWT authentication** with configurable expiry (`JWT_EXPIRY`)
- **Bcrypt password hashing** (cost factor 12) via pre-save Mongoose hooks
- **Helmet.js** security headers on every response
- **Rate limiting**: 100 req/15min global, 20 req/15min on auth endpoints
- **express-validator** input sanitisation on all API inputs
- Role-based access control (`isAdmin`) enforced at middleware level
- No sensitive data in JWT payload — only MongoDB ObjectId

---

## 🛠️ Tech Stack

### Backend
| Technology | Role |
|---|---|
| **Node.js 20** + **Express 5** | HTTP server & REST API |
| **Socket.IO 4** | Bidirectional real-time communication |
| **Mongoose 9** + **MongoDB** | ODM + database |
| **mongodb-memory-server** | Zero-config in-process MongoDB (dev/demo) |
| **jsonwebtoken** | JWT signing & verification |
| **bcryptjs** | Password hashing |
| **helmet** | HTTP security headers |
| **express-rate-limit** | DDoS/brute-force protection |
| **express-validator** | Input validation & sanitisation |
| **morgan** | HTTP request logging |
| **Jest** + **Supertest** | Unit & integration testing |

### Frontend
| Technology | Role |
|---|---|
| **Next.js 16** (App Router) | Full-stack React framework |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Page transitions & micro-animations |
| **Socket.IO Client** | Real-time data subscription |
| **Recharts** | Charts (Area, Bar, Line, Radar) |
| **ShadCN UI** | Accessible component primitives |
| **Lucide React** | Icon system |
| **Sonner** | Toast notifications |

### Infrastructure
| Technology | Role |
|---|---|
| **Docker** + **Docker Compose** | Containerisation |
| **Google Cloud Run** | Serverless container hosting |
| **Google Container Registry** | Private image registry |
| **Google Cloud Build** | CI/CD pipeline (`cloudbuild.yaml`) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                       │
│                                                          │
│  ┌──────────────┐    REST (fetch/apiFetch)               │
│  │  Next.js 16  │ ──────────────────────────────────►   │
│  │  (App Router)│                                        │
│  │              │ ◄──────────────────────── Socket.IO    │
│  └──────────────┘          (sim_update / live_alert)     │
└───────────────────────────────────────────────────────┬─┘
                                                        │ HTTP + WS
                                    ┌───────────────────▼──────────────────┐
                                    │          EXPRESS SERVER               │
                                    │                                       │
                                    │  ┌─────────┐  ┌──────────────────┐   │
                                    │  │  Routes │  │  Socket.IO       │   │
                                    │  │/api/auth│  │  Engine          │   │
                                    │  └────┬────┘  └──────┬───────────┘   │
                                    │       │              │               │
                                    │  ┌────▼────┐  ┌──────▼───────────┐   │
                                    │  │Controller│  │SimulationService │   │
                                    │  │(Auth)   │  │(M/M/1 queuing)  │   │
                                    │  └────┬────┘  └──────────────────┘   │
                                    │       │                               │
                                    │  ┌────▼──────────────────────────┐   │
                                    │  │    Mongoose ODM               │   │
                                    │  │    User Model                 │   │
                                    │  └────┬──────────────────────────┘   │
                                    └───────┼──────────────────────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │        MongoDB             │
                              │  (in-memory dev / Atlas   │
                              │   production via MONGO_URI)│
                              └───────────────────────────┘
```

### Real-Time Data Flow

```
SimulationService (tick every 3s)
        │
        ▼
  generateSimulationData()
  ├── Time-of-day multiplier   → realistic crowd patterns
  ├── Momentum propagation     → smooth sector transitions
  ├── M/M/1 queue formula      → wait time per facility
  ├── 15-min linear projection → predictive densities
  └── AI insight generator     → contextual alerts
        │
        ▼
  Socket.IO broadcast → ALL connected clients
        │
        ▼
  SocketContext (React)
  ├── heatmap       → Sector Heatmap component
  ├── predictions   → Radar Chart
  ├── queues        → Queue Prediction panel
  ├── insights      → AI Insights feed
  └── bestPath      → Safe Navigation overlay
```

### Security Layers

```
Request → Helmet Headers → CORS → Rate Limiter → Router
                                                    │
                           Protected routes ─► JWT Middleware
                                                    │
                                             express-validator
                                                    │
                                              Controller
```

---

## 📁 Project Structure

```
PromptWars/
├── 📄 docker-compose.yml          # Local multi-service orchestration
├── 📄 cloudbuild.yaml             # GCP CI/CD pipeline
├── 📄 deploy-cloudrun.ps1         # One-command Cloud Run deployment
├── 📄 .env.example                # Root env template for Docker Compose
│
├── backend/
│   ├── 📄 server.js               # Entry point — HTTP server + Socket.IO
│   ├── 📄 app.js                  # Express factory (testable without listener)
│   ├── 📄 database.js             # MONGO_URI → real MongoDB | fallback in-memory
│   ├── 📄 socket.js               # Socket.IO init, sim loop, alert broadcast
│   ├── 📄 seed.js                 # Idempotent user seeder
│   ├── 📄 Dockerfile              # Multi-stage Node.js production image
│   ├── 📄 .env.example            # Backend env template
│   ├── controllers/
│   │   └── authController.js      # register · login · getMe
│   ├── middlewares/
│   │   ├── authMiddleware.js       # JWT protect · adminOnly
│   │   ├── errorMiddleware.js      # Centralised error handler
│   │   └── validationMiddleware.js # express-validator integration
│   ├── models/
│   │   └── User.js                # Mongoose schema + bcrypt pre-save hook
│   ├── routes/
│   │   └── auth.js                # POST /register · POST /login · GET /me
│   ├── services/
│   │   └── simulationService.js   # M/M/1 engine · time-of-day model · AI insights
│   └── __tests__/
│       ├── auth.test.js            # Auth endpoint integration tests
│       └── middleware.test.js      # JWT middleware unit tests
│
└── frontend/
    ├── 📄 next.config.ts          # output: standalone (Docker-optimised)
    ├── 📄 Dockerfile              # Multi-stage Next.js production image
    ├── 📄 .env.example            # Frontend env template
    └── src/
        ├── app/
        │   ├── page.tsx            # Landing page
        │   ├── login/page.tsx      # Login form
        │   ├── register/page.tsx   # Registration form
        │   ├── dashboard/page.tsx  # User dashboard (heatmap · queues · radar)
        │   └── admin/page.tsx      # Admin analytics + broadcast
        ├── components/
        │   ├── Sidebar.tsx         # Navigation sidebar
        │   ├── Providers.tsx       # Context provider wrapper
        │   └── ui/                 # ShadCN component primitives
        ├── context/
        │   ├── AuthContext.tsx     # JWT auth state + localStorage persistence
        │   └── SocketContext.tsx   # Socket.IO state + all real-time data
        └── lib/
            ├── api.ts              # Central API utility (apiFetch + SOCKET_URL)
            └── utils.ts            # cn() helper
```

---

## 📸 Screenshots

> **User Dashboard — Live Heatmap**
>
> *12 sectors updated every 3 seconds. Green = safe, red = critical. Dashed borders mark the AI-recommended safe path. Predictive arrows show each sector's 15-minute direction.*

```
┌─────────────────────────────────────────────────────┐
│  [ A1 ]  [ A2 ]  [ A3 ]  [ A4 ]                    │
│   45%     62%     81%*    74%                       │
│   LOW     MED    HIGH    HIGH                       │
│                                                     │
│  [ B1 ]  [ B2 ]  [ B3 ]  [ B4 ]                    │
│   38%     29%     55%     41%                       │
│   LOW     LOW     MED     LOW                       │
│                                                     │
│  [ C1 ]  [ C2 ]  [ C3 ]  [ C4 ]                    │
│   20%     15%     31%     48%                       │
│   LOW     LOW     LOW     MED                       │
└─────────────────────────────────────────────────────┘
  * Pulsing red glow on critical sectors
```

> **Admin Analytics — Full Dashboard**
>
> Four live charts: Crowd Density Flow (area) · Zone Traffic (bar) · Peak Time Prediction (line) · Queue Wait Trends per facility (multi-line)

> **Emergency Broadcast Panel**
>
> Type a message → press Enter or ▶ → all connected user dashboards receive a live alert banner with timestamp within milliseconds.

---

## 🚀 Quick Start (Local)

### Option A — Windows One-Click

```bat
.\start.bat
```

Launches backend and frontend in separate terminal windows automatically.

### Option B — Manual Setup

**Prerequisites**: Node.js 18+ · No database installation needed

```bash
# 1. Clone the repository
git clone https://github.com/prathmesh2028/PromptWars_Hackathon.git
cd PromptWars_Hackathon

# 2. Start the backend
cd backend
cp .env.example .env       # copy and edit if needed
npm install
npm start
# → Backend available at http://localhost:5000

# 3. Start the frontend (new terminal)
cd frontend
cp .env.example .env.local  # copy and edit if needed
npm install
npm run dev
# → Frontend available at http://localhost:3000
```

The backend automatically boots an **in-memory MongoDB** instance and seeds demo users — no setup required.

### Running Tests

```bash
cd backend
npm test                    # all tests
npm run test:coverage       # with coverage report
npm run test:watch          # watch mode during development
```

---

## 🔐 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@smartvenue.ai` | `password123` | Full dashboard + analytics + emergency broadcast |
| **User** | `john@example.com` | `password123` | Dashboard + heatmap + queue predictions |

> These credentials are seeded automatically on first boot via `seed.js`.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Auto | `5000` | Server port (overridden by Cloud Run) |
| `NODE_ENV` | ✅ | `development` | `development` \| `production` \| `test` |
| `JWT_SECRET` | ✅ prod | — | Min 32-char random string. **Fails fast in production if missing.** |
| `JWT_EXPIRY` | — | `7d` | Token lifetime (`7d`, `24h`, `30m`) |
| `FRONTEND_URL` | ✅ | `http://localhost:3000` | Used for Express CORS + Socket.IO CORS |
| `MONGO_URI` | — | *(in-memory)* | MongoDB URI for persistent storage |

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:5000` | Backend REST API base URL (baked into build) |
| `NEXT_PUBLIC_SOCKET_URL` | — | *(same as API URL)* | Override if WebSocket server differs |

> `NEXT_PUBLIC_*` variables are embedded into the JavaScript bundle at **build time**. Changing them requires a rebuild.

---

## 🐳 Docker Deployment

### One-Command Local Stack

```bash
# Copy env files
cp .env.example .env
cp backend/.env.example backend/.env

# Build and start both containers
docker compose up --build -d

# View logs
docker compose logs -f
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |

### Useful Commands

```bash
docker compose down              # Stop all
docker compose build --no-cache  # Force rebuild
docker compose exec backend sh   # Shell into backend
docker compose ps                # Health status
```

### Multi-Stage Build Optimisation

| Stage | Backend | Frontend |
|-------|---------|----------|
| **deps** | `npm ci --omit=dev` | `npm ci` |
| **builder** | — | `next build` (standalone) |
| **runner** | Alpine + non-root user | Alpine + standalone bundle |
| **Final size** | ~150 MB | ~200 MB |

---

## ☁️ Google Cloud Run Deployment

### Automated (Recommended)

```powershell
# One command — handles everything
.\deploy-cloudrun.ps1 -ProjectId "your-gcp-project-id"
```

The script will:
1. Enable all required GCP APIs
2. Authenticate Docker with GCR
3. Build + push the backend image
4. Deploy the backend → capture its HTTPS URL
5. Build the frontend with the backend URL baked in
6. Deploy the frontend
7. Update backend CORS with the frontend URL
8. Print both public HTTPS URLs

### Manual Step-by-Step

```powershell
$PROJECT = "your-project-id"
$REGION  = "us-central1"

# Authenticate + enable APIs
gcloud auth login
gcloud config set project $PROJECT
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# Build & deploy backend
docker build -t gcr.io/$PROJECT/smartvenue-backend:latest ./backend
docker push gcr.io/$PROJECT/smartvenue-backend:latest

gcloud run deploy smartvenue-backend `
  --image=gcr.io/$PROJECT/smartvenue-backend:latest `
  --region=$REGION --platform=managed --allow-unauthenticated `
  --min-instances=1 --memory=512Mi `
  --set-env-vars="NODE_ENV=production,JWT_SECRET=YOUR_SECRET,JWT_EXPIRY=7d"

# Get backend URL
$BACKEND_URL = gcloud run services describe smartvenue-backend `
  --region=$REGION --format="value(status.url)"

# Build & deploy frontend (backend URL baked in at build time)
docker build --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL `
  -t gcr.io/$PROJECT/smartvenue-frontend:latest ./frontend
docker push gcr.io/$PROJECT/smartvenue-frontend:latest

gcloud run deploy smartvenue-frontend `
  --image=gcr.io/$PROJECT/smartvenue-frontend:latest `
  --region=$REGION --platform=managed --allow-unauthenticated `
  --min-instances=1 --memory=512Mi `
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=$BACKEND_URL"
```

### Required IAM Roles

| Role | Purpose |
|------|---------|
| `roles/run.admin` | Deploy Cloud Run services |
| `roles/storage.admin` | Push to Container Registry |
| `roles/cloudbuild.builds.editor` | Trigger Cloud Build |
| `roles/iam.serviceAccountUser` | Cloud Build service account access |

### WebSocket Support (Socket.IO)

```powershell
# Enable session affinity for stable WebSocket connections
gcloud run services update smartvenue-backend `
  --region=$REGION --session-affinity
```

---

## 📡 API Reference

Base URL: `http://localhost:5000`

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Create a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate and receive JWT |
| `GET` | `/api/auth/me` | 🔒 JWT | Get current user profile |

#### POST `/api/auth/register`
```json
// Request
{ "name": "Jane Smith", "email": "jane@example.com", "password": "mypassword" }

// Response 201
{
  "success": true,
  "data": { "_id": "...", "name": "Jane Smith", "email": "jane@example.com", "isAdmin": false, "token": "eyJ..." }
}
```

#### POST `/api/auth/login`
```json
// Request
{ "email": "admin@smartvenue.ai", "password": "password123" }

// Response 200
{
  "success": true,
  "data": { "_id": "...", "name": "Admin User", "email": "admin@smartvenue.ai", "isAdmin": true, "token": "eyJ..." }
}
```

### WebSocket Events

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Server → Client | `sim_update` | `SimulationData` | Full snapshot every 3 seconds |
| Client → Server | `push_alert` | `string` | Admin broadcasts an emergency alert |
| Server → Client | `live_alert` | `{ message, timestamp }` | Alert forwarded to all clients |

#### `SimulationData` shape
```typescript
{
  heatmap:     Record<string, number>;   // sector → density %
  predictions: Record<string, number>;   // sector → 15-min forecast %
  queues:      { name, zone, waitTime }[];
  insights:    { level, message }[];
  bestPath:    string[];                 // 3 lowest-density sectors
  totalCrowd:  number;
  risk:        "normal" | "warning" | "critical";
  timeMul:     number;                   // time-of-day activity % (0–100)
  tick:        number;
}
```

---

## 🔭 Future Scope

### Phase 2 — Smart Integration
- [ ] **Real sensor ingestion** — MQTT / HTTP webhook bridge for physical IoT crowd sensors
- [ ] **MongoDB Atlas** — persistent data with historical trend analysis & replay mode
- [ ] **Geospatial mapping** — integrate Mapbox GL for GPS-accurate sector positioning

### Phase 3 — Intelligence Upgrade
- [ ] **Machine learning model** — replace momentum-based simulation with LSTM sequence prediction trained on historical event data
- [ ] **Computer vision integration** — camera feed density estimation via YOLO or MediaPipe
- [ ] **Anomaly detection** — statistical alerting on unusual density patterns (stampede precursors)

### Phase 4 — Scale & Operations
- [ ] **Multi-venue support** — venue hierarchy with global ops center view
- [ ] **Mobile app** — React Native companion for on-ground security staff
- [ ] **Push notifications** — PWA + FCM for offline alert delivery
- [ ] **RBAC expansion** — venue manager, sector supervisor, security roles
- [ ] **Audit log** — immutable event log for post-incident analysis
- [ ] **Capacity planning AI** — pre-event simulation seeded with ticket sales data

---

## 📜 License

This project was built for the **PromptWars Hackathon**. All rights reserved.

---

<div align="center">

Built with ❤️ using Node.js · Next.js · Socket.IO · MongoDB · Docker · Google Cloud Run

</div>
