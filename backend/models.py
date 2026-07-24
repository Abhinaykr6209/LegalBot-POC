from sqlalchemy import create_engine, Column, String, Text, Integer, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./audit.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    password_salt = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="analyst")


class AuditLogEntry(Base):
    __tablename__ = "audit_log_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    decision_id = Column(String, unique=True, nullable=False)
    timestamp_utc = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    user_display_name = Column(String, nullable=False)
    ai_system = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    input_text = Column(Text, nullable=False)
    input_source = Column(String, nullable=False)
    policy_invoked = Column(String, nullable=False)
    reasoning_summary = Column(Text, nullable=False)
    output_text = Column(Text, nullable=False)
    downstream_action = Column(String, nullable=False)
    parent_decision_id = Column(String, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    prev_hash = Column(String, nullable=False)
    entry_hash = Column(String, nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)

    # Add new columns for existing databases
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('audit_log_entries')]
    with engine.connect() as conn:
        if 'prompt_tokens' not in columns:
            conn.execute(text("ALTER TABLE audit_log_entries ADD COLUMN prompt_tokens INTEGER"))
        if 'completion_tokens' not in columns:
            conn.execute(text("ALTER TABLE audit_log_entries ADD COLUMN completion_tokens INTEGER"))
        conn.commit()

    # Backfill estimated tokens for existing entries (new entries get exact from API)
    with SessionLocal() as db:
        from sqlalchemy import text as sql_text
        db.execute(
            sql_text(
                "UPDATE audit_log_entries "
                "SET prompt_tokens = MAX(1, LENGTH(input_text) / 4), "
                "completion_tokens = MAX(1, LENGTH(output_text) / 4) "
                "WHERE source_type != 'review_event' AND prompt_tokens IS NULL"
            )
        )
        db.commit()

    from auth import seed_demo_users

    db = SessionLocal()
    try:
        seed_demo_users(db)
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
