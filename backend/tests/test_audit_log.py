import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, AuditLogEntry
from audit_service import create_audit_log_entry, verify_chain


@pytest.fixture
def test_db():
    db_fd, db_path = tempfile.mkstemp()
    database_url = f"sqlite:///{db_path}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    yield session

    session.close()
    os.close(db_fd)
    os.unlink(db_path)


def test_audit_log_chain_creation_and_verification(test_db):
    entry1 = create_audit_log_entry(
        source_type="chat_console",
        user_id="user123",
        user_display_name="Alice",
        ai_system="claude",
        model_version="1.0",
        input_text="What is 2+2?",
        input_source="console",
        policy_invoked="general",
        reasoning_summary="Simple math",
        output_text="4",
        downstream_action="log",
        db=test_db,
    )

    entry2 = create_audit_log_entry(
        source_type="shadow_detector",
        user_id="user456",
        user_display_name="Bob",
        ai_system="claude",
        model_version="1.0",
        input_text="What is 3+3?",
        input_source="detector",
        policy_invoked="content_filter",
        reasoning_summary="Math question",
        output_text="6",
        downstream_action="flag",
        db=test_db,
    )

    assert entry1.decision_id is not None
    assert entry2.decision_id is not None
    assert entry1.entry_hash is not None
    assert entry2.entry_hash is not None
    assert entry1.prev_hash == "GENESIS"
    assert entry2.prev_hash == entry1.entry_hash

    result = verify_chain(db=test_db)
    assert result["valid"] is True


def test_audit_log_chain_corruption_detection(test_db):
    entry1 = create_audit_log_entry(
        source_type="chat_console",
        user_id="user123",
        user_display_name="Alice",
        ai_system="claude",
        model_version="1.0",
        input_text="What is 2+2?",
        input_source="console",
        policy_invoked="general",
        reasoning_summary="Simple math",
        output_text="4",
        downstream_action="log",
        db=test_db,
    )

    entry2 = create_audit_log_entry(
        source_type="shadow_detector",
        user_id="user456",
        user_display_name="Bob",
        ai_system="claude",
        model_version="1.0",
        input_text="What is 3+3?",
        input_source="detector",
        policy_invoked="content_filter",
        reasoning_summary="Math question",
        output_text="6",
        downstream_action="flag",
        db=test_db,
    )

    result = verify_chain(db=test_db)
    assert result["valid"] is True

    corrupted_entry = test_db.query(AuditLogEntry).filter(AuditLogEntry.id == entry1.id).first()
    corrupted_entry.output_text = "wrong answer"
    test_db.commit()

    result = verify_chain(db=test_db)
    assert result["valid"] is False
    assert result["broken_at_decision_id"] == entry1.decision_id
