from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base

class ResultStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETE = "COMPLETE"

class PassFailStatus(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SUPPLEMENTARY = "SUPPLEMENTARY"

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    
    half_yearly_total = Column(Float, default=0.0)
    annual_total = Column(Float, default=0.0)
    annual_max_marks = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    
    pass_fail_status = Column(SQLEnum(PassFailStatus), nullable=True)
    division_grade = Column(String(50), nullable=True)  # Entered manually by teacher e.g. "1st", "2nd", "3rd", "A+", etc.
    completion_status = Column(SQLEnum(ResultStatus), default=ResultStatus.PENDING, nullable=False)
    
    finalized_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    finalized_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("Student", back_populates="result")
    finalized_by_user = relationship("User", foreign_keys=[finalized_by])
