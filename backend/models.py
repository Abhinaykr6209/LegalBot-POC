import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Text, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in environment variables")

# PostgreSQL does not require check_same_thread
engine = create_engine(DATABASE_URL)
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