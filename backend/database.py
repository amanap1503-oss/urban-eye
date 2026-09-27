import os
import urllib.parse
import asyncpg
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:aryan%408291@localhost:5432/urban_eye"
)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

async def init_postgres_db():
    """
    Connects to default 'postgres' database and creates 'urban_eye' database if missing.
    """
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

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

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
