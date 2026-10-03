import os
import urllib.parse
import asyncpg
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

def _resolve_database_url() -> str:
    """
    Resolve the active database URL.

    Priority:
      1. DATABASE_URL env var (PostgreSQL/Neon when reachable, or an explicit sqlite path)
      2. Local SQLite file, so reports always persist even when the Postgres
         host is unreachable (e.g. outbound port 5432 blocked on this machine/network).
    """
    raw = (os.getenv("DATABASE_URL") or "").strip()

    if raw:
        if raw.startswith("postgresql://"):
            raw = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Normalize bare sqlite URLs to the async aiosqlite driver
        if raw.startswith("sqlite:///") and not raw.startswith("sqlite+aiosqlite:///"):
            raw = raw.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return raw

    sqlite_path = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "urban_eye.db"))
    return f"sqlite+aiosqlite:///{sqlite_path}"


DATABASE_URL = _resolve_database_url()
IS_SQLITE = DATABASE_URL.startswith("sqlite")

async def init_postgres_db():
    """
    Connects to default 'postgres' database and creates 'urban_eye' database if missing.
    """
    if IS_SQLITE:
        print("[Database] Using local SQLite file. No PostgreSQL init needed.")
        return

    if "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
        print("[PostgreSQL Init] Skipping auto-create for remote database.")
        return
        
    try:
        url_body = DATABASE_URL.split("://")[1]
        user_pass, host_port_db = url_body.split("@")
        user, password = user_pass.split(":") if ":" in user_pass else (user_pass, "")
        user = urllib.parse.unquote(user)
        password = urllib.parse.unquote(password)
        
        host_port = host_port_db.split("/")[0]
        db_name = host_port_db.split("/")[1].split("?")[0]
        host = host_port.split(":")[0]
        port = int(host_port.split(":")[1]) if ":" in host_port else 5432

        conn = await asyncpg.connect(user=user, password=password, host=host, port=port, database="postgres")
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", db_name)
        if not exists:
            print(f"[PostgreSQL] Database '{db_name}' not found. Auto-creating database '{db_name}'...")
            await conn.execute(f'CREATE DATABASE "{db_name}"')
            print(f"[PostgreSQL] Database '{db_name}' created successfully!")
        await conn.close()
    except Exception as e:
        print(f"[PostgreSQL Init Info] {e}")

if IS_SQLITE:
    # SQLite + aiosqlite runs on a single-threaded driver; disable pooling so
    # concurrent async requests share one connection safely.
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=None,
    )
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        pool_pre_ping=True,
        connect_args={"timeout": 30},
    )

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
