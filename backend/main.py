from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models import init_db, get_db, AuditLogEntry
from audit_service import create_audit_log_entry, verify_chain
from chat_service import process_chat_message
from export_service import filter_entries, export_as_json, export_as_csv
from review_service import create_review, get_reviews_for_entry
from auth import (
    register_user,
    login_user,
    get_current_user,
    require_audit_access,
    resolve_user_from_authorization,
    RegisterRequest,
    LoginRequest,
    UserResponse,
)

load_dotenv()

app = FastAPI(title="AI Audit Trail POC")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


class CreateAuditLogRequest(BaseModel):
    source_type: str
    user_id: str
    user_display_name: str
    ai_system: str
    model_version: str
    input_text: str
    input_source: str
    policy_invoked: str
    reasoning_summary: str
    output_text: str
    downstream_action: str
    parent_decision_id: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: int
    decision_id: str
    timestamp_utc: str
    source_type: str
    user_id: str
    user_display_name: str
    ai_system: str
    model_version: str
    input_text: str
    input_source: str
    policy_invoked: str
    reasoning_summary: str
    output_text: str
    downstream_action: str
    parent_decision_id: Optional[str]
    prev_hash: str
    entry_hash: str

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    policy_id: str = "general_assistant_v1"


class ChatResponse(BaseModel):
    reply: str
    decision_id: str


class ReviewRequest(BaseModel):
    status: str  # "approved" or "flagged"
    comment: str


class DetectorEventRequest(BaseModel):
    domain: str
    matched_ai_system: str
    tab_title: str
    timestamp_client: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "time_utc": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/auth/register", response_model=dict)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    result = register_user(request, db)
    return {"token": result.token, "user": result.user}


@app.post("/api/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    result = login_user(request, db)
    return {"token": result.token, "user": result.user}


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        result = process_chat_message(
            message=request.message,
            policy_id=request.policy_id,
            current_user=current_user,
            db=db,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process chat message")


@app.post("/api/audit-logs", response_model=AuditLogResponse)
def create_audit_log(
    request: CreateAuditLogRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_audit_access),
):
    entry = create_audit_log_entry(
        source_type=request.source_type,
        user_id=request.user_id,
        user_display_name=request.user_display_name,
        ai_system=request.ai_system,
        model_version=request.model_version,
        input_text=request.input_text,
        input_source=request.input_source,
        policy_invoked=request.policy_invoked,
        reasoning_summary=request.reasoning_summary,
        output_text=request.output_text,
        downstream_action=request.downstream_action,
        parent_decision_id=request.parent_decision_id,
        db=db,
    )
    return entry


@app.get("/api/audit-logs", response_model=list[AuditLogResponse])
def list_audit_logs(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_audit_access),
):
    entries = (
        db.query(AuditLogEntry)
        .order_by(AuditLogEntry.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return entries


@app.get("/api/audit-logs/verify")
def verify_audit_chain(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_audit_access),
):
    result = verify_chain(db=db)
    return result


@app.get("/api/audit-logs/export")
def export_audit_logs(
    format: str = "json",
    source_type: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_audit_access),
):
    if format not in ["json", "csv"]:
        raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")

    entries = filter_entries(
        db=db,
        source_type=source_type,
        from_date=from_date,
        to_date=to_date,
    )

    if format == "json":
        content = export_as_json(entries)
        media_type = "application/json"
        filename = "audit-trail.json"
    else:
        content = export_as_csv(entries)
        media_type = "text/csv"
        filename = "audit-trail.csv"

    output = io.BytesIO(content.encode())
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/api/audit-logs/{decision_id}", response_model=AuditLogResponse)
def get_audit_log(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_audit_access),
):
    entry = db.query(AuditLogEntry).filter(AuditLogEntry.decision_id == decision_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@app.get("/api/audit-logs/{decision_id}/reviews", response_model=list[AuditLogResponse])
def get_entry_reviews(
    decision_id: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_audit_access),
):
    return get_reviews_for_entry(decision_id, db)


@app.post("/api/audit-logs/{decision_id}/review", response_model=AuditLogResponse)
def submit_review(
    decision_id: str,
    request: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(require_audit_access),
):
    if request.status not in ["approved", "flagged"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'flagged'")

    try:
        review_entry = create_review(
            decision_id=decision_id,
            status=request.status,
            comment=request.comment,
            reviewer=current_user,
            db=db,
        )
        return review_entry
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/detector/event", response_model=AuditLogResponse)
def log_detector_event(
    request: DetectorEventRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    user = resolve_user_from_authorization(authorization, db)
    if user:
        user_id = user.id
        user_display_name = user.display_name
    else:
        user_id = "unknown"
        user_display_name = "Unidentified (extension not signed in)"

    tab_title = (request.tab_title or "").strip() or "(untitled tab)"
    visit_summary = f"Opened {request.matched_ai_system} at {request.domain}"
    presence_detail = (
        f"Browser visit detected to {request.matched_ai_system} ({request.domain}). "
        f"Tab: “{tab_title}”. "
        "Only presence is recorded — page content and keystrokes are out of scope for this POC."
    )

    entry = create_audit_log_entry(
        source_type="shadow_detector",
        user_id=user_id,
        user_display_name=user_display_name,
        ai_system=request.matched_ai_system,
        model_version="External SaaS — model version not visible to org",
        input_text=visit_summary,
        input_source="browser_extension",
        policy_invoked="Shadow AI Usage Policy v0.1",
        reasoning_summary=presence_detail,
        output_text="No model output captured (external site; presence-only monitoring)",
        downstream_action=f"Shadow AI visit logged — {tab_title}",
        db=db,
    )

    return entry
