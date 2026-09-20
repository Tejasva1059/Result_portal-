from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(100), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE_MARKS, UPDATE_MARKS, UPDATE_DIVISION, IMPORT_STUDENTS, etc.
    entity_type = Column(String(50), nullable=False)  # MARKS, RESULT, STUDENT, USER
    entity_id = Column(Integer, nullable=True)
    student_name = Column(String(100), nullable=True)
    class_name = Column(String(50), nullable=True)
    subject_name = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)  # JSON or text description of changes e.g. "Theory changed from 40 to 45"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User")
