from sqlalchemy.orm import Session
from models import AuditLogEntry
from audit_service import create_audit_log_entry
from auth import UserResponse
from datetime import datetime, timezone


def create_review(
    response_id: str,
    status: str,
    comment: str,
    reviewer: UserResponse,
    db: Session,
) -> AuditLogEntry:

    original_entry = (
        db.query(AuditLogEntry)
        .filter(AuditLogEntry.response_id == response_id)
        .first()
    )

    if not original_entry:
        raise ValueError(f"Entry {response_id} not found")

    # -------------------------
    # Update Approval Workflow
    # -------------------------

    original_entry.approval_status = status.capitalize()
    original_entry.approved_by = reviewer.display_name
    original_entry.approved_at = datetime.now(timezone.utc)

    if status.lower() == "approved":
        original_entry.review_comment = comment
        original_entry.flagged_reason = None

    elif status.lower() == "flagged":
        original_entry.flagged_reason = comment
        original_entry.review_comment = None

    else:
        original_entry.review_comment = comment

    db.commit()
    db.refresh(original_entry)

    # -------------------------
    # Create immutable review log
    # -------------------------

    review_entry = create_audit_log_entry(
        source_type="review_event",
        user_id=reviewer.id,
        user_display_name=reviewer.display_name,
        ai_system="N/A – human review event",
        model_version="N/A",
        input_text="N/A",
        input_source="N/A",
        policy_invoked=original_entry.policy_invoked,
        reasoning_summary="N/A",
        output_text=comment,
        downstream_action=f"Review recorded: {status}",
        parent_response_id=original_entry.response_id,
        db=db,
    )

    return review_entry


def get_reviews_for_entry(response_id: str, db: Session):
    return db.query(AuditLogEntry).filter(
        AuditLogEntry.source_type == "review_event",
        AuditLogEntry.parent_response_id == response_id,
    ).order_by(AuditLogEntry.timestamp_utc.asc()).all()
