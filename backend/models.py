import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class DBUser(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    uid = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="citizen") # citizen, official, ward
    points = Column(Integer, default=120)
    city = Column(String, default="Mumbai")
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBIssue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    priority = Column(String, default="medium") # critical, high, medium, low
    status = Column(String, default="new") # new, in_progress, resolved
    location = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    city = Column(String, default="Mumbai")
    image_url = Column(String, nullable=True)
    voice_recording_url = Column(Text, nullable=True)
    reporter_id = Column(String, nullable=True)
    reporter_name = Column(String, default="Anonymous Citizen")
    votes = Column(Integer, default=1)
    upvoted_by = Column(JSON, default=list) # List of user UIDs who upvoted
    flagged_fake = Column(Boolean, default=False)
    flagged_reason = Column(String, nullable=True)
    assigned_team = Column(String, nullable=True)
    assigned_officers = Column(JSON, default=list) # List of officer names
    assigned_at = Column(DateTime, nullable=True)
    sla_hours = Column(Integer, default=24)
    priority_level = Column(String, nullable=True) # AI priority level: critical, high, medium, low
    sla_deadline = Column(DateTime, nullable=True) # created_at + sla_hours
    escalated = Column(Boolean, default=False)     # SLA breached / escalated to senior desk
    
    # Real-time AI analysis fields from Gemini Vision
    ai_score = Column(Integer, default=50)
    ai_summary = Column(Text, nullable=True)
    ai_risk_assessment = Column(Text, nullable=True)
    citizen_impact_score = Column(Integer, default=50)
    recommended_action = Column(Text, nullable=True)
    ai_full_report = Column(Text, nullable=True)
    ai_annotated_image_url = Column(String, nullable=True)
    yolo_detections = Column(JSON, default=list) # List of detected objects with confidence

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Field officer proof submissions
    site_arrival_proof = Column(JSON, nullable=True)   # {imageUrl, lat, lng, locationName, arrivedAt, arrivedBy}
    resolution_proof = Column(JSON, nullable=True)      # {imageUrl, lat, lng, locationName, resolvedAt, resolvedBy, approvedByCitizen}

class DBNotification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, index=True, nullable=True) # Target user UID or "all"
    type = Column(String, nullable=False) # team_assigned, status_change, upvote, critical_issue, issue_reported
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    icon = Column(String, default="🔔")
    issue_id = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBActivity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_name = Column(String, nullable=False)
    user_avatar = Column(String, nullable=True)
    action = Column(String, nullable=False)
    target = Column(String, nullable=False)
    city = Column(String, default="Mumbai")
    created_at = Column(DateTime, default=datetime.utcnow)
