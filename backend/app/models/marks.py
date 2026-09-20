from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base

class ExamType(str, enum.Enum):
    HALF_YEARLY = "HALF_YEARLY"
    ANNUAL = "ANNUAL"

class Mark(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    exam_type = Column(SQLEnum(ExamType), nullable=False)
    
    # Half-yearly or general maximum and obtained marks
    max_marks = Column(Float, default=100.0, nullable=False)
    
    # Annual breakdown: Theory and Practical/Internal
    theory_max = Column(Float, default=75.0, nullable=True)
    theory_obtained = Column(Float, nullable=True)
    practical_max = Column(Float, default=25.0, nullable=True)
    practical_obtained = Column(Float, nullable=True)
    
    # Total obtained (calculated automatically)
    total_obtained = Column(Float, nullable=False)
    
    entered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Constraint: One mark record per student per subject per exam type
    __table_args__ = (
        UniqueConstraint('student_id', 'subject_id', 'exam_type', name='uix_student_subject_exam'),
    )

    # Relationships
    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    entered_by_user = relationship("User", foreign_keys=[entered_by])
    updated_by_user = relationship("User", foreign_keys=[updated_by])
