import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.future import select

from database import engine, Base, AsyncSessionLocal, init_postgres_db, IS_SQLITE
from models import DBIssue, DBUser, DBNotification
from routers import auth, issues
from services.websocket_manager import ws_manager

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure urban_eye database exists in PostgreSQL
    await init_postgres_db()

    # Initialize PostgreSQL tables & migrate missing columns
    print("[Database] Creating database tables & verifying schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if not IS_SQLITE:
            # Auto-migrate columns added after initial deployment (PostgreSQL only;
            # SQLite is fully covered by create_all above).
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS yolo_detections JSONB DEFAULT '[]'::jsonb;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS ai_full_report TEXT;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS ai_annotated_image_url VARCHAR;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS site_arrival_proof JSON;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS resolution_proof JSON;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS voice_recording_url TEXT;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS priority_level VARCHAR;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP;"))
            await conn.execute(text("ALTER TABLE issues ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE;"))
            # Backfill AI priority level for pre-existing rows
            await conn.execute(text("UPDATE issues SET priority_level = priority WHERE priority_level IS NULL;"))
            # Backfill SLA deadline for pre-existing rows that never got one
            await conn.execute(text(
                "UPDATE issues SET sla_deadline = created_at + (COALESCE(sla_hours, 24) * INTERVAL '1 hour') "
                "WHERE sla_deadline IS NULL;"
            ))
    print(f"[Database] Tables & columns verified ({'SQLite' if IS_SQLITE else 'PostgreSQL'}).")

    yield
    print("[Shutdown] Closing server...")

app = FastAPI(
    title="Urban Eye Backend API",
    description="Real-time Python FastAPI + PostgreSQL + Gemini Vision AI Backend for Urban Eye Civic Governance",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Vite frontend & Vercel
cors_env = os.getenv("CORS_ORIGINS", "")
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
allowed_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()] if cors_env else default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    # Vercel deploys + any localhost/127.0.0.1 dev port (Vite auto-increments the port)
    allow_origin_regex=r"(https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1):\d+)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for issue uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(auth.router)
app.include_router(issues.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "Urban Eye Real-time Backend",
        "database": "PostgreSQL",
        "ai_engine": "Google Gemini Vision",
        "websocket": "/ws/{user_id}"
    }

@app.get("/notifications")
async def get_notifications(user_id: str = "all"):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(DBNotification).order_by(DBNotification.created_at.desc()))
        notifs = result.scalars().all()
        output = []
        for n in notifs:
            output.append({
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "icon": n.icon,
                "issueId": n.issue_id,
                "createdAt": n.created_at.isoformat(),
                "read": n.read
            })
        return output

# Real-time WebSocket Endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming ping / messages if needed
            try:
                parsed = json.loads(data)
                if parsed.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"[WebSocket Error] Exception in connection: {e}")
        ws_manager.disconnect(websocket, user_id)
