import os
import uuid
import shutil
import httpx
import cloudinary
import cloudinary.uploader
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import DBIssue, DBNotification, DBActivity
from schemas import IssueStatusUpdateSchema, IssueAssignTeamSchema, IssueFlagSchema, ProofSubmitSchema, CitizenApprovalSchema
from services.ai_service import analyze_issue_with_ai
from services.websocket_manager import ws_manager

router = APIRouter(prefix="/issues", tags=["Issues"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Configure Cloudinary with credentials from environment
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.getenv("CLOUDINARY_API_KEY", ""),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "")
)

# Only attempt Cloudinary when fully configured; otherwise go straight to local disk
CLOUDINARY_ENABLED = bool(
    os.getenv("CLOUDINARY_CLOUD_NAME")
    and os.getenv("CLOUDINARY_API_KEY")
    and os.getenv("CLOUDINARY_API_SECRET")
)


def _save_locally(file_bytes: bytes, original_filename: Optional[str], is_annotated: bool = False) -> str:
    """Persist an uploaded image to the local uploads/ folder and return its public path."""
    if is_annotated:
        filename = f"ann_{uuid.uuid4().hex}.jpg"
    else:
        ext = original_filename.split(".")[-1] if original_filename and "." in original_filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    return f"/uploads/{filename}"


def _persist_image(file_bytes: bytes, original_filename: Optional[str]) -> str:
    """
    Upload to Cloudinary when available, otherwise persist to local disk.
    Never raises — a report must always be savable even with no network egress.
    """
    if CLOUDINARY_ENABLED:
        try:
            print("[Cloudinary] Uploading image to Cloudinary...")
            upload_result = cloudinary.uploader.upload(file_bytes)
            url = upload_result.get("secure_url")
            if url:
                print(f"[Cloudinary] Upload success! URL: {url}")
                return url
            print("[Cloudinary] Upload returned no URL. Falling back to local upload.")
        except Exception as e:
            print(f"[Cloudinary Error] Upload failed: {e}. Falling back to local upload.")
    return _save_locally(file_bytes, original_filename)

# Statuses that stop the SLA clock (issue is effectively closed/awaiting sign-off)
_SLA_CLOSED_STATUSES = {"Resolved", "resolved", "Pending Approval", "pending_approval", "Rejected", "rejected"}


def _sla_meta(issue: DBIssue) -> dict:
    """Derive SLA / escalation fields consumed by the frontend SLA Monitor."""
    deadline = issue.sla_deadline
    if deadline is None and issue.created_at is not None:
        deadline = issue.created_at + timedelta(hours=issue.sla_hours or 24)

    breached = bool(
        deadline is not None
        and deadline < datetime.utcnow()
        and (issue.status or "") not in _SLA_CLOSED_STATUSES
    )

    return {
        "priorityLevel": issue.priority_level or issue.priority or "medium",
        "slaDeadline": deadline.isoformat() if deadline else None,
        "escalated": bool(issue.escalated or breached),
        "assignedAt": issue.assigned_at.isoformat() if issue.assigned_at else None,
    }

@router.get("")
async def get_all_issues(city: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(DBIssue).order_by(DBIssue.created_at.desc())
    if city:
        query = query.where(DBIssue.city == city)
    result = await db.execute(query)
    issues = result.scalars().all()
    
    # Format issues list
    output = []
    for i in issues:
        output.append({
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "category": i.category,
            "priority": i.priority,
            "status": i.status,
            "location": i.location,
            "lat": i.lat,
            "lng": i.lng,
            "city": i.city or "Mumbai",
            "imageUrl": i.image_url,
            "reporterId": i.reporter_id,
            "reporterName": i.reporter_name or "Anonymous Citizen",
            "reportedBy": i.reporter_id or i.reporter_name or "Anonymous Citizen",
            "votes": i.votes or 1,
            "upvotedBy": i.upvoted_by or [],
            "flaggedFake": i.flagged_fake or False,
            "flaggedReason": i.flagged_reason,
            "assignedTeam": i.assigned_team,
            "assignedOfficers": i.assigned_officers or [],
            "slaHours": i.sla_hours or 24,
            "aiScore": i.ai_score or 50,
            "aiSummary": i.ai_summary,
            "aiRiskAssessment": i.ai_risk_assessment,
            "citizenImpactScore": i.citizen_impact_score or 50,
            "recommendedAction": i.recommended_action,
            "yoloDetections": i.yolo_detections or [],
            "siteArrivalProof": i.site_arrival_proof,
            "resolutionProof": i.resolution_proof,
            "voiceRecordingUrl": i.voice_recording_url,
            "createdAt": i.created_at.isoformat() if i.created_at else datetime.utcnow().isoformat(),
            "reportedAt": i.created_at.isoformat() if i.created_at else datetime.utcnow().isoformat(),
            **_sla_meta(i),
        })
    return output

@router.get("/{issue_id}/ai-report")
async def get_issue_ai_report(issue_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        res = await db.execute(select(DBIssue))
        all_issues = res.scalars().all()
        issue = next((i for i in all_issues if i.id.lower() == issue_id.lower()), None)
        if not issue:
            raise HTTPException(status_code=404, detail=f"Issue {issue_id} not found")

    full_report = issue.ai_full_report
    if not full_report:
        yolo_summary = ""
        if issue.yolo_detections:
            dets = [f"{d.get('class', 'object')} ({float(d.get('confidence', 0))*100:.0f}%)" for d in issue.yolo_detections if isinstance(d, dict)]
            if dets:
                yolo_summary = f"Computer Vision (YOLOv8) detected: {', '.join(dets)}. "
        
        full_report = (
            f"INSPECTION REPORT FOR ISSUE #{issue.id}:\n\n"
            f"Citizen Complaint Summary: '{issue.title}' - {issue.description}\n"
            f"Location: '{issue.location}, {issue.city or 'Mumbai'}' | Category: {issue.category}\n\n"
            f"{yolo_summary}"
            f"AI Severity Score is rated at {issue.ai_score or 50}/100 with a Citizen Impact Score of {issue.citizen_impact_score or 50}/100. "
            f"Risk Assessment: {issue.ai_risk_assessment or 'Moderate civic hazard requiring standard municipal resolution.'}\n"
            f"Recommended Action: {issue.recommended_action or 'Dispatch maintenance crew to site within standard SLA timeframe.'}\n"
            f"Expected resolution SLA window is {issue.sla_hours or 24} hours."
        )

    return {
        "issue_id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "category": issue.category,
        "location": issue.location,
        "image_url": issue.image_url,
        "status": issue.status,
        "priority": issue.priority or "medium",
        "ai_score": issue.ai_score or 50,
        "citizen_impact_score": issue.citizen_impact_score or 50,
        "suggested_category": issue.category,
        "summary": issue.ai_summary or f"{issue.title}: {issue.description[:120]}...",
        "risk_assessment": issue.ai_risk_assessment or "Standard civic issue.",
        "recommended_action": issue.recommended_action or "Dispatch municipal squad.",
        "suggested_sla_hours": issue.sla_hours or 24,
        "full_report": full_report,
        "yolo_detections": issue.yolo_detections or [],
        "ai_annotated_image_url": issue.ai_annotated_image_url or issue.image_url,
        "voice_recording_url": issue.voice_recording_url,
        "image_analyzed": bool(issue.image_url),
        "yolo_ran": bool(issue.yolo_detections)
    }

@router.post("")
async def create_issue(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    city: str = Form("Mumbai"),
    reporter_id: str = Form(""),
    reporter_name: str = Form("Anonymous Citizen"),
    voice_recording: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    image_url = None
    image_bytes = None

    if image:
        image_bytes = await image.read()
        image_url = _persist_image(image_bytes, image.filename)

    # Analyze with Gemini Vision AI
    ai_result = await analyze_issue_with_ai(image_bytes, description, category, location)

    ai_annotated_image_url = None
    annotated_bytes = ai_result.get("annotated_image_bytes")
    if annotated_bytes:
        if CLOUDINARY_ENABLED:
            try:
                print("[Cloudinary] Uploading annotated YOLO image...")
                upload_result = cloudinary.uploader.upload(annotated_bytes)
                ai_annotated_image_url = upload_result.get("secure_url")
                print(f"[Cloudinary] Annotated image success! URL: {ai_annotated_image_url}")
            except Exception as e:
                print(f"[Cloudinary Error] Annotated upload failed: {e}. Falling back to local.")
        if not ai_annotated_image_url:
            ai_annotated_image_url = _save_locally(annotated_bytes, None, is_annotated=True)

    issue_id = f"iss-{uuid.uuid4().hex[:8]}"
    suggested_sla = ai_result.get("suggested_sla_hours", 24)
    ai_priority = ai_result.get("priority", "medium")
    new_issue = DBIssue(
        id=issue_id,
        title=title,
        description=description,
        category=ai_result.get("suggested_category", category),
        priority=ai_priority,
        priority_level=ai_priority,
        status="Reported",
        location=location,
        lat=lat,
        lng=lng,
        city=city,
        image_url=image_url,
        voice_recording_url=voice_recording,
        reporter_id=reporter_id,
        reporter_name=reporter_name,
        votes=1,
        upvoted_by=[reporter_id] if reporter_id else [],
        flagged_fake=False,
        sla_hours=suggested_sla,
        sla_deadline=datetime.utcnow() + timedelta(hours=suggested_sla or 24),
        escalated=False,
        ai_score=ai_result.get("ai_score", 65),
        ai_summary=ai_result.get("summary", ""),
        ai_risk_assessment=ai_result.get("risk_assessment", ""),
        citizen_impact_score=ai_result.get("citizen_impact_score", 60),
        recommended_action=ai_result.get("recommended_action", ""),
        ai_full_report=ai_result.get("full_report", ""),
        ai_annotated_image_url=ai_annotated_image_url,
        yolo_detections=ai_result.get("yolo_detections", [])
    )

    db.add(new_issue)

    # Add Notification
    notif = DBNotification(
        user_id="all",
        type="issue_reported",
        title=f"📍 New Report: {title}",
        message=f"New civic issue reported in {location}, {city}. AI Priority: {new_issue.priority.upper()}.",
        icon="📍",
        issue_id=issue_id
    )
    db.add(notif)

    # Add Activity
    act = DBActivity(
        user_name=reporter_name,
        action="reported",
        target=title,
        city=city
    )
    db.add(act)

    # Credit +50 reward points to user in PostgreSQL database
    if reporter_id:
        from models import DBUser
        user_res = await db.execute(select(DBUser).where(DBUser.uid == reporter_id))
        db_user = user_res.scalars().first()
        if db_user:
            db_user.points = (db_user.points or 0) + 50

    await db.commit()
    await db.refresh(new_issue)

    formatted_issue = {
        "id": new_issue.id,
        "title": new_issue.title,
        "description": new_issue.description,
        "category": new_issue.category,
        "priority": new_issue.priority,
        "status": new_issue.status,
        "location": new_issue.location,
        "lat": new_issue.lat,
        "lng": new_issue.lng,
        "city": new_issue.city,
        "imageUrl": new_issue.image_url,
        "reporterId": new_issue.reporter_id,
        "reporterName": new_issue.reporter_name,
        "reportedBy": new_issue.reporter_id or new_issue.reporter_name or "Anonymous Citizen",
        "votes": new_issue.votes,
        "upvotedBy": new_issue.upvoted_by,
        "flaggedFake": new_issue.flagged_fake,
        "assignedTeam": new_issue.assigned_team,
        "assignedOfficers": new_issue.assigned_officers,
        "slaHours": new_issue.sla_hours,
        "aiScore": new_issue.ai_score,
        "aiSummary": new_issue.ai_summary,
        "aiRiskAssessment": new_issue.ai_risk_assessment,
        "citizenImpactScore": new_issue.citizen_impact_score,
        "recommendedAction": new_issue.recommended_action,
        "yoloDetections": new_issue.yolo_detections or [],
        "voiceRecordingUrl": new_issue.voice_recording_url,
        "createdAt": new_issue.created_at.isoformat(),
        **_sla_meta(new_issue),
    }

    # Broadcast real-time issue creation via WebSocket
    await ws_manager.broadcast({
        "type": "issue_created",
        "issue": formatted_issue
    })

    return formatted_issue
@router.delete("")
async def delete_all_issues(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import delete
    await db.execute(delete(DBIssue))
    await db.commit()

    await ws_manager.broadcast({
        "type": "all_issues_deleted"
    })

    return {"success": True, "message": "All issues have been cleared"}

@router.delete("/{issue_id}")
async def delete_issue(issue_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    await db.delete(issue)
    await db.commit()

    # Broadcast real-time deletion via WebSocket
    await ws_manager.broadcast({
        "type": "issue_deleted",
        "issue_id": issue_id
    })

    return {"success": True, "message": f"Issue {issue_id} deleted"}

@router.patch("/{issue_id}/upvote")
async def upvote_issue(issue_id: str, user_id: str = Form(""), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    upvoted_list = list(issue.upvoted_by or [])
    if user_id and user_id in upvoted_list:
        upvoted_list.remove(user_id)
        issue.votes = max(0, (issue.votes or 1) - 1)
    else:
        if user_id:
            upvoted_list.append(user_id)
        issue.votes = (issue.votes or 0) + 1

    issue.upvoted_by = upvoted_list
    await db.commit()

    await ws_manager.broadcast({
        "type": "issue_upvoted",
        "issue_id": issue_id,
        "votes": issue.votes,
        "upvotedBy": issue.upvoted_by
    })

    return {"success": True, "votes": issue.votes, "upvotedBy": issue.upvoted_by}

@router.patch("/{issue_id}/status")
async def update_issue_status(issue_id: str, payload: IssueStatusUpdateSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = payload.status
    
    # Add notification for status change
    notif = DBNotification(
        user_id=issue.reporter_id or "all",
        type="status_change",
        title=f"🔄 Status Updated: {payload.status}",
        message=f"Issue '{issue.title}' status changed to '{payload.status}'.",
        icon="🔄",
        issue_id=issue_id
    )
    db.add(notif)

    await db.commit()

    await ws_manager.broadcast({
        "type": "issue_status_updated",
        "issue_id": issue_id,
        "status": payload.status
    })

    return {"success": True, "status": payload.status}

@router.patch("/{issue_id}/team")
async def assign_team(issue_id: str, payload: IssueAssignTeamSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.assigned_team = payload.team_name
    issue.assigned_officers = payload.officer_names
    issue.assigned_at = datetime.utcnow()
    if payload.sla_hours:
        issue.sla_hours = payload.sla_hours
    # Re-anchor the SLA deadline to the moment of assignment
    issue.sla_deadline = datetime.utcnow() + timedelta(hours=issue.sla_hours or 24)
    issue.escalated = False

    # Send direct real-time notification to reporting citizen
    notif = DBNotification(
        user_id=issue.reporter_id or "all",
        type="team_assigned",
        title="🛡️ Response Team Assigned!",
        message=f"Admin assigned '{payload.team_name}' to your report '{issue.title}'. Officers: {', '.join(payload.officer_names)}. Target SLA: {issue.sla_hours} Hours.",
        icon="🛡️",
        issue_id=issue_id
    )
    db.add(notif)
    await db.commit()

    # Real-time WebSocket broadcast to updating citizen
    await ws_manager.broadcast({
        "type": "team_assigned",
        "issue_id": issue_id,
        "reporterId": issue.reporter_id,
        "teamName": payload.team_name,
        "officerNames": payload.officer_names,
        "slaHours": issue.sla_hours,
        "assignedAt": issue.assigned_at.isoformat(),
        "slaDeadline": issue.sla_deadline.isoformat() if issue.sla_deadline else None,
        "notification": {
            "id": notif.id,
            "type": notif.type,
            "title": notif.title,
            "message": notif.message,
            "icon": notif.icon,
            "issueId": notif.issue_id,
            "createdAt": notif.created_at.isoformat(),
            "read": False
        }
    })

    return {
        "success": True,
        "assignedTeam": payload.team_name,
        "assignedOfficers": payload.officer_names,
        "slaHours": issue.sla_hours,
        **_sla_meta(issue),
    }

@router.post("/{issue_id}/flag-fake")
async def flag_fake_issue(issue_id: str, payload: IssueFlagSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.flagged_fake = True
    issue.flagged_reason = payload.reason
    await db.commit()

    await ws_manager.broadcast({
        "type": "issue_flagged",
        "issue_id": issue_id,
        "reason": payload.reason
    })

    return {"success": True}


# ─────────────────────────────────────────────────────────
#  AI REPORT ENDPOINT
#  GET /issues/{issue_id}/ai-report
#  Runs YOLO + Gemini on the stored issue and returns
#  a fully detailed AI analysis + human-readable report.
# ─────────────────────────────────────────────────────────
@router.get("/{issue_id}/ai-report")
async def get_ai_report(issue_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieves the pre-generated AI report from the database instantly.
    If the report is not found (e.g. for legacy/pre-seeded issues),
    it generates it on the fly, saves it to the database, and returns it.
    """
    # 1. Fetch issue from DB
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # 2. Check if AI report is already pre-generated in DB
    if issue.ai_full_report:
        if issue.image_url and not issue.ai_annotated_image_url:
            print(f"[AI Report] Issue {issue_id} has a report but no annotated image. Generating...")
            try:
                from services.ai_service import run_yolo_detection
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(issue.image_url)
                    if resp.status_code == 200:
                        _, annotated_bytes = run_yolo_detection(resp.content, issue.category or "General")
                        if annotated_bytes:
                            try:
                                upload_result = cloudinary.uploader.upload(annotated_bytes)
                                issue.ai_annotated_image_url = upload_result.get("secure_url")
                            except Exception as upload_err:
                                print(f"[AI Report] Lazy upload failed: {upload_err}. Saving locally.")
                                filename = f"ann_{uuid.uuid4().hex}.jpg"
                                filepath = os.path.join(UPLOAD_DIR, filename)
                                with open(filepath, "wb") as f:
                                    f.write(annotated_bytes)
                                issue.ai_annotated_image_url = f"/uploads/{filename}"
                            await db.commit()
                            print(f"[AI Report] Successfully generated and cached annotated image: {issue.ai_annotated_image_url}")
            except Exception as e:
                print(f"[AI Report] Lazy annotated image generation failed: {e}")

        print(f"[AI Report] Serving cached report for issue {issue_id} from DB.")
        return {
            "issue_id": issue.id,
            "title": issue.title,
            "description": issue.description,
            "category": issue.category,
            "location": issue.location,
            "image_url": issue.image_url,
            "status": issue.status,
            "priority": issue.priority,
            "ai_score": issue.ai_score,
            "citizen_impact_score": issue.citizen_impact_score,
            "suggested_category": issue.category,
            "summary": issue.ai_summary or "",
            "risk_assessment": issue.ai_risk_assessment or "",
            "recommended_action": issue.recommended_action or "",
            "suggested_sla_hours": issue.sla_hours,
            "full_report": issue.ai_full_report,
            "yolo_detections": issue.yolo_detections or [],
            "ai_annotated_image_url": issue.ai_annotated_image_url,
            "image_analyzed": issue.image_url is not None,
            "yolo_ran": len(issue.yolo_detections or []) > 0,
        }

    # 3. If missing (legacy issues), generate on-the-fly and save
    print(f"[AI Report] Report not found in DB for {issue_id}. Generating live...")
    image_bytes = None
    if issue.image_url:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(issue.image_url)
                if resp.status_code == 200:
                    image_bytes = resp.content
                    print(f"[AI Report] Downloaded image for legacy issue {issue_id} ({len(image_bytes)} bytes)")
        except Exception as e:
            print(f"[AI Report] Legacy image download failed: {e}")

    analysis = await analyze_issue_with_ai(
        image_bytes=image_bytes,
        description=issue.description or "",
        category=issue.category or "General",
        location=issue.location or "Unknown location"
    )

    # Save to database
    ai_annotated_image_url = None
    annotated_bytes = analysis.get("annotated_image_bytes")
    if annotated_bytes:
        if CLOUDINARY_ENABLED:
            try:
                print("[Cloudinary] Uploading annotated YOLO image for legacy issue...")
                upload_result = cloudinary.uploader.upload(annotated_bytes)
                ai_annotated_image_url = upload_result.get("secure_url")
                print(f"[Cloudinary] Legacy annotated image success! URL: {ai_annotated_image_url}")
            except Exception as e:
                print(f"[Cloudinary Error] Legacy annotated upload failed: {e}. Falling back to local.")
        if not ai_annotated_image_url:
            ai_annotated_image_url = _save_locally(annotated_bytes, None, is_annotated=True)

    issue.ai_score = analysis.get("ai_score", issue.ai_score)
    issue.ai_summary = analysis.get("summary", issue.ai_summary)
    issue.ai_risk_assessment = analysis.get("risk_assessment", issue.ai_risk_assessment)
    issue.citizen_impact_score = analysis.get("citizen_impact_score", issue.citizen_impact_score)
    issue.recommended_action = analysis.get("recommended_action", issue.recommended_action)
    issue.ai_full_report = analysis.get("full_report", "")
    issue.ai_annotated_image_url = ai_annotated_image_url or issue.ai_annotated_image_url
    if analysis.get("yolo_detections"):
        issue.yolo_detections = analysis.get("yolo_detections")

    await db.commit()

    return {
        "issue_id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "category": issue.category,
        "location": issue.location,
        "image_url": issue.image_url,
        "status": issue.status,
        "priority": analysis.get("priority"),
        "ai_score": analysis.get("ai_score"),
        "citizen_impact_score": analysis.get("citizen_impact_score"),
        "suggested_category": analysis.get("suggested_category"),
        "summary": analysis.get("summary"),
        "risk_assessment": analysis.get("risk_assessment"),
        "recommended_action": analysis.get("recommended_action"),
        "suggested_sla_hours": analysis.get("suggested_sla_hours"),
        "full_report": analysis.get("full_report"),
        "yolo_detections": analysis.get("yolo_detections", []),
        "ai_annotated_image_url": issue.ai_annotated_image_url,
        "image_analyzed": image_bytes is not None,
        "yolo_ran": len(analysis.get("yolo_detections", [])) > 0,
    }


# ── Upload image for proof (arrival or resolution) ─────────────────────────────
@router.post("/upload-proof")
async def upload_proof_image(
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload an image file and return its URL — used by Employee Portal proof forms."""
    image_bytes = await image.read()
    ext = image.filename.split(".")[-1] if image.filename and "." in image.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)
    image_url = f"/uploads/{filename}"
    return {"success": True, "imageUrl": image_url, "url": image_url}


# ── Site Arrival Proof ─────────────────────────────────────────────────────────
@router.patch("/{issue_id}/arrival-proof")
async def submit_arrival_proof(issue_id: str, payload: ProofSubmitSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    arrived_at = datetime.utcnow().isoformat()
    proof_data = {
        "imageUrl": payload.image_url,
        "lat": payload.lat,
        "lng": payload.lng,
        "locationName": payload.location_name or issue.location,
        "arrivedAt": arrived_at,
        "arrivedBy": payload.submitted_by or "Field Officer"
    }
    issue.site_arrival_proof = proof_data
    issue.status = "In Progress"

    # Notify reporting citizen
    notif = DBNotification(
        user_id=issue.reporter_id or "all",
        type="status_change",
        title="🚛 Field Team Arrived at Site",
        message=f"{payload.submitted_by} has reached the location for '{issue.title}'. Status moved to In Progress.",
        icon="🚛",
        issue_id=issue_id
    )
    db.add(notif)
    await db.commit()

    await ws_manager.broadcast({
        "type": "arrival_proof_submitted",
        "issue_id": issue_id,
        "status": "in_progress",
        "siteArrivalProof": proof_data,
        "notification": {
            "id": notif.id, "type": notif.type, "title": notif.title,
            "message": notif.message, "icon": notif.icon,
            "issueId": issue_id, "createdAt": notif.created_at.isoformat(), "read": False
        }
    })

    return {"success": True, "status": "in_progress", "siteArrivalProof": proof_data}


# ── Resolution Proof ───────────────────────────────────────────────────────────
@router.patch("/{issue_id}/resolution-proof")
async def submit_resolution_proof(issue_id: str, payload: ProofSubmitSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    resolved_at = datetime.utcnow().isoformat()
    proof_data = {
        "imageUrl": payload.image_url,
        "lat": payload.lat,
        "lng": payload.lng,
        "locationName": payload.location_name or issue.location,
        "resolvedAt": resolved_at,
        "resolvedBy": payload.submitted_by or "Field Officer",
        "approvedByCitizen": False
    }
    issue.resolution_proof = proof_data
    issue.status = "Pending Approval"

    notif = DBNotification(
        user_id=issue.reporter_id or "all",
        type="status_change",
        title="⏳ Resolution Proof Submitted — Your Approval Needed",
        message=f"Field Officer {payload.submitted_by} resolved '{issue.title}'. Please review the proof and confirm.",
        icon="📸",
        issue_id=issue_id
    )
    db.add(notif)
    await db.commit()

    await ws_manager.broadcast({
        "type": "resolution_proof_submitted",
        "issue_id": issue_id,
        "status": "pending_approval",
        "resolutionProof": proof_data,
        "notification": {
            "id": notif.id, "type": notif.type, "title": notif.title,
            "message": notif.message, "icon": notif.icon,
            "issueId": issue_id, "createdAt": notif.created_at.isoformat(), "read": False
        }
    })

    return {"success": True, "status": "pending_approval", "resolutionProof": proof_data}


# ── Citizen Approval / Rejection ───────────────────────────────────────────────
@router.patch("/{issue_id}/citizen-approve")
async def citizen_approve(issue_id: str, payload: CitizenApprovalSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBIssue).where(DBIssue.id == issue_id))
    issue = result.scalars().first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    new_status = "Resolved" if payload.approved else "In Progress"
    issue.status = new_status

    # Update approvedByCitizen flag in resolution_proof JSON
    if issue.resolution_proof:
        updated_proof = dict(issue.resolution_proof)
        updated_proof["approvedByCitizen"] = payload.approved
        issue.resolution_proof = updated_proof

    notif = DBNotification(
        user_id="all",
        type="status_change",
        title="✅ Issue Confirmed Resolved" if payload.approved else "⚠️ Resolution Rejected by Citizen",
        message=f"Citizen {'confirmed' if payload.approved else 'rejected'} the resolution for '{issue.title}'.",
        icon="✅" if payload.approved else "⚠️",
        issue_id=issue_id
    )
    db.add(notif)
    await db.commit()

    await ws_manager.broadcast({
        "type": "citizen_approved",
        "issue_id": issue_id,
        "approved": payload.approved,
        "status": "resolved" if payload.approved else "in_progress"
    })

    return {"success": True, "approved": payload.approved, "status": new_status}
