from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    student_name = Column(String(100), nullable=False, index=True)
    father_name = Column(String(100), nullable=False)
    mother_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    contact_number = Column(String(20), nullable=True)
    scholar_number = Column(String(50), nullable=True, index=True)  # SSSMID / Scholar No.
    roll_number = Column(String(50), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Constraint: Unique roll number within the same class
    __table_args__ = (
        UniqueConstraint('class_id', 'roll_number', name='uix_class_roll_number'),
    )

    # Relationships
    student_class = relationship("Class", back_populates="students")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    result = relationship("Result", back_populates="student", uselist=False, cascade="all, delete-orphan")
