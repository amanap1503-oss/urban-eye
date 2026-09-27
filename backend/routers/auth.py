from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from database import get_db
from models import DBUser, DBNotification, DBIssue
from schemas import UserRegisterSchema, UserLoginSchema, AdminLoginSchema, UserProfileUpdateSchema

router = APIRouter(prefix="/auth", tags=["Auth & Users"])

@router.post("/register")
async def register_user(payload: UserRegisterSchema, db: AsyncSession = Depends(get_db)):
    # Look up by uid first, fall back to email
    existing = None
    if payload.uid:
        result = await db.execute(select(DBUser).where(DBUser.uid == payload.uid))
        existing = result.scalars().first()
    if not existing and payload.email:
        result = await db.execute(select(DBUser).where(DBUser.email == payload.email))
        existing = result.scalars().first()

    if existing:
        # Count this user's issues
        filed_result = await db.execute(
            select(func.count()).select_from(DBIssue).where(DBIssue.reporter_id == existing.uid)
        )
        reports_filed = filed_result.scalar() or 0
        resolved_result = await db.execute(
            select(func.count()).select_from(DBIssue).where(
                DBIssue.reporter_id == existing.uid,
                DBIssue.status.in_(["resolved", "Resolved"])
            )
        )
        reports_resolved = resolved_result.scalar() or 0

        return {
            "uid": existing.uid or existing.id,
            "name": existing.name,
            "email": existing.email,
            "role": existing.role,
            "points": existing.points,
            "city": existing.city,
            "reportsFiled": reports_filed,
            "reportsResolved": reports_resolved,
        }

    uid = payload.uid or f"usr-{payload.email.replace('@', '-').replace('.', '-')}"
    new_user = DBUser(
        uid=uid,
        name=payload.name,
        email=payload.email,
        role="citizen",
        points=120,
        city=payload.city or "Mumbai"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        "uid": new_user.uid,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
        "points": new_user.points,
        "city": new_user.city,
        "reportsFiled": 0,
        "reportsResolved": 0,
    }

@router.post("/login")
async def login_user(payload: UserLoginSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.email == payload.email))
    user = result.scalars().first()
    if not user:
        # Auto-create profile if first login
        user = DBUser(
            uid=payload.uid or f"usr-{payload.email.replace('@', '-').replace('.', '-')}",
            name=payload.email.split("@")[0].capitalize(),
            email=payload.email,
            role="citizen",
            points=120,
            city="Mumbai"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return {
        "uid": user.uid,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "points": user.points,
        "city": user.city
    }

@router.post("/admin/login")
async def admin_login(payload: AdminLoginSchema, db: AsyncSession = Depends(get_db)):
    if payload.admin_id == "aryan8291" and payload.password == "aryan@8291":
        # Ensure admin user exists in DB
        result = await db.execute(select(DBUser).where(DBUser.uid == "admin-aryan8291"))
        admin = result.scalars().first()
        if not admin:
            admin = DBUser(
                uid="admin-aryan8291",
                name="Aryan Sharma (City Administrator)",
                email="aryan.admin@mumbai.gov.in",
                role="official",
                points=999,
                city="Mumbai"
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)

        return {
            "success": True,
            "user": {
                "uid": admin.uid,
                "name": admin.name,
                "email": admin.email,
                "role": admin.role,
                "points": admin.points,
                "city": admin.city
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid Admin Credentials. Required: ID aryan8291 and Password aryan@8291")

@router.get("/profile/{uid}")
async def get_profile(uid: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.uid == uid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "uid": user.uid,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "points": user.points,
        "city": user.city,
        "photoURL": user.photo_url
    }

@router.patch("/profile/{uid}")
async def update_profile(uid: str, payload: UserProfileUpdateSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBUser).where(DBUser.uid == uid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name:
        user.name = payload.name
    if payload.photo_url:
        user.photo_url = payload.photo_url

    await db.commit()
    return {"success": True, "name": user.name, "photoURL": user.photo_url}
