from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g., 'NUR', 'KGI', 'KGII', 'I', 'II', 'III', 'IV', 'VI', 'VII'
    display_order = Column(Integer, default=0)

    # Relationships
    students = relationship("Student", back_populates="student_class", cascade="all, delete-orphan")
    class_subjects = relationship("ClassSubject", back_populates="academic_class", cascade="all, delete-orphan", order_by="ClassSubject.display_order")
    assigned_teachers = relationship("TeacherProfile", back_populates="assigned_class")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # e.g., 'Hindi', 'English', 'Mathematics', 'EVS', 'Science', 'Social Science', 'Sanskrit'
    code = Column(String(20), nullable=True)

    class_subjects = relationship("ClassSubject", back_populates="subject", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="subject")

class ClassSubject(Base):
    __tablename__ = "class_subjects"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    display_order = Column(Integer, default=0)
    
    # Configurable maximum marks defaults for this class-subject
    default_half_yearly_max = Column(Float, default=100.0)
    default_annual_theory_max = Column(Float, default=75.0)
    default_annual_practical_max = Column(Float, default=25.0)

    academic_class = relationship("Class", back_populates="class_subjects")
    subject = relationship("Subject", back_populates="class_subjects")
