# SmartVenue AI – Crowd Intelligence Platform

SmartVenue AI is a production-level full-stack web application designed for real-time monitoring and optimization of massive crowd movements. It features an AI-powered simulation that provides interactive heatmaps, queue wait-time predictions, smart route navigation, and instant emergency broadcasts.

---

## 🏗️ Project Architecture (MVC)

The project follows a clean, modular Model-View-Controller architecture on the backend and a component-based structure with Next.js App Router on the frontend.

### 📁 Folder Structure
```text
PromptWars/
├── backend/                 # Node.js + Express MVC Backend
│   ├── controllers/         # Business logic (Auth, Data handling)
│   ├── middlewares/         # Global Error handling & Protected routes
│   ├── models/              # Mongoose DB schemas
│   ├── routes/              # Endpoint definitions
│   ├── services/            # Simulation & AI logic services
│   ├── database.js          # DB connection (In-memory Mongo)
│   ├── server.js            # Entry point
│   └── socket.js            # Real-time WebSocket engine
├── frontend/                # Next.js 16 + Tailwind CSS v4 + ShadCN UI
│   ├── src/
│   │   ├── app/             # Application routes & layouts
│   │   ├── components/      # UI components & Providers
│   │   ├── context/         # Auth & Socket state management
│   │   └── lib/             # Utility functions
└── start.bat                # One-click Windows launch script
```

---

## 🚀 Step-by-Step Setup Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Git** (optional)
- No local database installation is required (uses `mongodb-memory-server`).

### 2. Automatic Setup (Windows)
Double-click the `start.bat` file in the root directory. This will:
- Initialize the Backend (installing dependencies if needed).
- Initialize the Frontend.
- Launch both servers in separate terminal windows.

### 3. Manual Setup

#### **Backend**
```bash
cd backend
npm install
npm start
```
*The backend will automatically start an in-memory MongoDB and seed it with sample data.*

#### **Frontend**
```bash
cd frontend
npm install
npm run dev
```
*Frontend will be available at http://localhost:3000.*

---

## 🔐 Login Credentials (Sample Data)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@smartvenue.ai` | `password123` |
| **User** | `john@example.com` | `password123` |

---

## 🔥 Core Features
- **Real-time Heatmap**: Dynamic visual representation of venue sectors updated every 3 seconds.
- **AI Queue Predictor**: Algorithmic estimations for wait times based on live density.
- **Smart Navigation**: AI-driven "Safe Path" recommendations to avoid congestion.
- **Emergency Broadcast**: Admin dashboard with global alert push capabilities.
- **Production Performance**: Full MVC backend with standardized error handling and efficient state management.
