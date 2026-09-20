from pydantic import BaseModel
from typing import Optional, List

class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int

    class Config:
        from_attributes = True

class ClassSubjectResponse(BaseModel):
    id: int
    subject_id: int
    subject_name: str
    subject_code: Optional[str] = None
    display_order: int
    default_half_yearly_max: float
    default_annual_theory_max: float
    default_annual_practical_max: float

    class Config:
        from_attributes = True

class ClassTeacherBrief(BaseModel):
    user_id: int
    full_name: str
    designation: Optional[str] = None

class ClassBase(BaseModel):
    name: str
    display_order: int = 0

class ClassResponse(ClassBase):
    id: int
    students_count: int = 0
    assigned_teacher: Optional[ClassTeacherBrief] = None
    subjects: List[ClassSubjectResponse] = []

    class Config:
        from_attributes = True
