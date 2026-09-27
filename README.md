<div align="center">

# 🏙️ Urban Eye — AI-Powered Smart City Civic Governance Platform

**Report · Track · Resolve — Real-time civic issue management powered by AI, YOLO Vision & Gemini**

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%28Neon%29-336791?style=flat-square&logo=postgresql)
![YOLOv8](https://img.shields.io/badge/AI-YOLOv8%20Multi--Model-FF6F00?style=flat-square&logo=pytorch)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Vision-4285F4?style=flat-square&logo=google)
![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=flat-square&logo=firebase)

</div>

---

## 📌 What is Urban Eye?

**Urban Eye** is a full-stack, AI-augmented civic governance platform that empowers citizens to report urban issues (potholes, garbage dumps, broken utilities, safety hazards, etc.) while giving city officials powerful AI tools to prioritize, dispatch, and resolve them.

> Think of it as a **super-intelligent 311 system** — where every report is automatically analyzed by computer vision (YOLO), scored by Google Gemini AI, tracked in real-time via WebSockets, and resolved through a structured SLA workflow.

---

## ✨ Key Features

### 👥 For Citizens
| Feature | Description |
|---|---|
| 📍 **Report Issues** | Submit civic complaints with photo, voice recording, GPS location, and category |
| 🗺️ **Live Map View** | See all reported issues on an interactive map with cluster markers |
| 📊 **Kanban Tracker** | Track your issue through `New → In Progress → Pending Approval → Resolved` |
| ✅ **Citizen Approval** | Approve or reject field team resolution proof before issue is marked resolved |
| 🏆 **Rewards & Points** | Earn civic points for every report filed — redeem for rewards |
| 🔔 **Real-time Notifications** | Instant WebSocket alerts when your issue gets assigned, updated, or resolved |
| 🎙️ **Voice Recording** | Attach voice notes to issue reports for richer context |
| 🌐 **Multilingual Support** | UI available in multiple languages (i18n built-in) |

### 🛡️ For City Admins (Official / Ward Reps)
| Feature | Description |
|---|---|
| 🧠 **AI Command Center** | City-wise AI prioritization matrix — issues ranked by AI severity score |
| 👮 **Workforce Roster** | Manage municipal officers: shifts, departments, status |
| ⚡ **Smart Dispatch** | AI recommends best response team based on category & officer availability |
| ⏱️ **SLA Monitor** | Live countdown timers for every open issue — auto-escalation on breach |
| 📋 **AI Reports Dashboard** | Full YOLO + Gemini analysis report per issue with annotated images |
| 🤖 **AI Dossier** | Detailed AI complaint dossier with risk assessment and recommended action |

### 🏗️ For Field Employees
| Feature | Description |
|---|---|
| 📷 **Site Arrival Proof** | Upload geo-tagged arrival photo to confirm presence at site |
| 📸 **Resolution Proof** | Upload before/after resolution photo with GPS verification |
| 📋 **Task Assignment View** | See all issues assigned, sorted by SLA priority |

---

## 🤖 AI & Computer Vision Pipeline

Every issue submitted with an image goes through a multi-stage AI pipeline:

```
Citizen submits issue + photo
        │
        ▼
┌─────────────────────────────────┐
│  STEP 1: YOLO Object Detection  │
│                                 │
│  Specialized model (by category)│
│  + General YOLOv8n model        │
│  Results merged & ranked        │
└────────────┬────────────────────┘
             │  detections + confidence scores
             ▼
┌─────────────────────────────────┐
│  STEP 2: Google Gemini Vision   │
│                                 │
│  YOLO results + image + desc    │
│  → Severity score (1-100)       │
│  → Priority: critical/high/...  │
│  → SLA hours recommendation     │
│  → Full inspection report       │
│  → Risk assessment              │
└────────────┬────────────────────┘
             │  structured JSON
             ▼
┌─────────────────────────────────┐
│  STEP 3: Stored in PostgreSQL   │
│  + Annotated image → Cloudinary │
│  + Real-time WS broadcast       │
└─────────────────────────────────┘
```

### 🎯 YOLO Models Used

| Model File | Task | Triggered For |
|---|---|---|
| `yolov8m-seg-garbage.pt` | **Segmentation** — Garbage detection (Glass/Metal/Paper/Plastic/Waste) | Environment, Public Spaces, Sanitation |
| `hemletYoloV8_100epochs.pt` | Detection — Safety helmet / unprotected head | Safety |
| `best.pt` | Detection — Manhole / Sewage inlet | Utilities, Infrastructure |
| `license_plate_detector.pt` | Detection — Vehicle license plates | Traffic |
| `yolov8n.pt` | General urban COCO detection | All categories (fallback) |

> The garbage model is a **YOLOv8m segmentation model** (52MB) — much more accurate than standard detection, producing pixel-level instance masks for each garbage type.

---

## 🛠️ Tech Stack

### Frontend
```
Next.js 15 (App Router) + TypeScript
├── Framer Motion        — Animations & micro-interactions
├── Lucide React         — Icon system
├── Firebase Auth        — Google / GitHub OAuth login
├── Leaflet.js           — Interactive map
└── Vanilla CSS          — Custom design system (dark glassmorphism UI)
```

### Backend
```
Python FastAPI (Async)
├── SQLAlchemy 2.0 (async) — ORM
├── PostgreSQL via Neon     — Serverless cloud database
├── asyncpg                 — Async PostgreSQL driver
├── WebSockets              — Real-time issue broadcasts
├── Ultralytics YOLOv8      — Multi-model computer vision
├── Google Gemini Vision    — AI analysis & report generation
├── Cloudinary              — Annotated image CDN storage
└── Python-JOSE + Passlib   — JWT authentication
```

### Infrastructure
```
Firebase            — Authentication (Google + GitHub OAuth)
Neon PostgreSQL     — Serverless auto-scaling database
Cloudinary          — Image + annotated image CDN
Vercel              — Frontend deployment
```

---

## 📁 Project Structure

```
Urban-eye/
├── frontend/                    # Next.js 15 App
│   └── src/app/
│       ├── pages/
│       │   ├── Landing.tsx      # Homepage
│       │   ├── Dashboard.tsx    # Citizen dashboard
│       │   ├── ReportIssue.tsx  # Issue submission form
│       │   ├── MapView.tsx      # Live issue map
│       │   ├── Kanban.tsx       # Issue tracker board
│       │   ├── AdminPortal.tsx  # AI Command Center (admin only)
│       │   ├── EmployeePortal.tsx # Field employee view
│       │   ├── Profile.tsx      # User profile & stats
│       │   └── Rewards.tsx      # Civic rewards system
│       ├── context/
│       │   └── AppContext.tsx   # Global state + API integration
│       └── lib/
│           ├── apiClient.ts     # Backend API client
│           ├── wsClient.ts      # WebSocket client
│           ├── firebase.ts      # Firebase config
│           └── aiAnalyzerService.ts # Client-side AI analysis
│
├── backend/                     # FastAPI Python Backend
│   ├── main.py                  # App entry, CORS, WebSocket endpoint
│   ├── database.py              # PostgreSQL async engine
│   ├── models.py                # SQLAlchemy ORM models
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── routers/
│   │   ├── auth.py              # User register, login, admin auth
│   │   └── issues.py            # Issue CRUD + AI trigger + team dispatch
│   ├── services/
│   │   ├── ai_service.py        # YOLO + Gemini AI pipeline
│   │   └── websocket_manager.py # WebSocket connection manager
│   ├── yolomodels/              # YOLO model weights (.pt files)
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL database (or free [Neon](https://neon.tech) cloud DB)
- Google Gemini API key ([Get free at AI Studio](https://aistudio.google.com/))
- Firebase project ([Create at Firebase Console](https://console.firebase.google.com/))

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/paraoxxx6969/Urban-eye.git
cd Urban-eye
```

---

### 2️⃣ Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Mac / Linux
source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
# PostgreSQL (Neon or local)
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DBNAME?ssl=require

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Auth
SECRET_KEY=your_random_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Cloudinary (for storing annotated AI images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at: **http://localhost:8000**  
📚 Interactive API docs: **http://localhost:8000/docs**

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` folder:

```env
VITE_API_URL=http://127.0.0.1:8000

# Firebase Configuration (from Firebase Console → Project Settings → Web App)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Start the frontend:
```bash
npm run dev
```

✅ App running at: **http://localhost:5173**

---

## 🔑 Login Roles

| Role | How to Login | Portal Access |
|---|---|---|
| **Citizen** | Google or GitHub OAuth (Firebase) | Dashboard, Report Issue, Map, Kanban, Rewards, Profile |
| **City Admin / Official** | Admin ID + Password on Auth page | Admin Portal (AI Command Center, Roster, Dispatch, SLA) |
| **Field Employee** | Employee ID on Auth page | Employee Portal (Site Arrival + Resolution Proof) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register or sync user from Firebase |
| `POST` | `/auth/admin/login` | Admin login with credentials |
| `GET` | `/issues` | Fetch all civic issues |
| `POST` | `/issues` | Submit new issue → triggers YOLO + Gemini AI |
| `PATCH` | `/issues/{id}/status` | Update issue status |
| `PATCH` | `/issues/{id}/upvote` | Upvote an issue |
| `PATCH` | `/issues/{id}/team` | Assign response team to issue |
| `PATCH` | `/issues/{id}/arrival-proof` | Submit field team site arrival proof |
| `PATCH` | `/issues/{id}/resolution-proof` | Submit field team resolution proof |
| `PATCH` | `/issues/{id}/citizen-approve` | Citizen approves or rejects resolution |
| `DELETE` | `/issues/{id}` | Delete an issue |
| `GET` | `/notifications` | Fetch all notifications |
| `WS` | `/ws/{user_id}` | Real-time WebSocket connection |

---

## 🌐 Real-time WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `issue_created` | Server → All clients | New issue submitted |
| `issue_deleted` | Server → All clients | Issue removed |
| `issue_status_updated` | Server → All clients | Status changed |
| `issue_upvoted` | Server → All clients | Someone upvoted |
| `team_assigned` | Server → All clients | Team dispatched |
| `arrival_proof_submitted` | Server → Reporter | Field team arrived at site |
| `resolution_proof_submitted` | Server → Reporter | Resolution proof uploaded |
| `citizen_approved` | Server → All clients | Citizen approved/rejected resolution |
| `ping` / `pong` | Client ↔ Server | Heartbeat keep-alive |

---

## 🗄️ Database Schema

```sql
-- Users table
users (
  id, uid, name, email, city, role,
  points, reports_filed, reports_resolved, created_at
)

-- Issues table (with full AI fields)
issues (
  id, title, description, category, priority, status,
  location, city, lat, lng,
  image_url, reporter_id, reporter_name,
  votes, upvoted_by,
  ai_score, priority_level, sla_hours, sla_deadline, escalated,
  assigned_team, assigned_officers, assigned_at,
  yolo_detections (JSONB),      -- Array of detected objects
  ai_summary, ai_risk_assessment, recommended_action,
  ai_full_report,               -- Full Gemini inspection report
  ai_annotated_image_url,       -- YOLO-annotated image URL (Cloudinary)
  site_arrival_proof (JSON),    -- Geo-tagged arrival photo
  resolution_proof (JSON),      -- Geo-tagged resolution photo
  voice_recording_url,          -- Citizen voice note
  created_at
)

-- Notifications table
notifications (
  id, type, title, message, icon,
  issue_id, user_id, read, created_at
)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-awesome-feature`
3. Commit your changes: `git commit -m "feat: add my awesome feature"`
4. Push to GitHub: `git push origin feature/my-awesome-feature`
5. Open a Pull Request 🎉

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ for smarter, cleaner, and safer cities.**

*Urban Eye — Where every citizen voice becomes civic action.*

</div>
