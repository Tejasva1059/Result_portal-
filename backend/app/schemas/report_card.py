from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import date
from app.schemas.marks import StudentSubjectMarksRow

class ReportCardHeader(BaseModel):
    school_name: str
    address: str
    institute_code: str
    dise_code: str
    academic_session: str
    report_card_title: str
    logo_url: str

class ReportCardStudentInfo(BaseModel):
    id: int
    student_name: str
    father_name: str
    mother_name: str
    date_of_birth: Optional[date] = None
    contact_number: Optional[str] = None
    scholar_number: Optional[str] = None
    roll_number: Union[str, int]
    class_name: str
    address: Optional[str] = None

class ReportCardTotals(BaseModel):
    half_yearly_max: float
    half_yearly_obtained: float
    annual_theory_max: float
    annual_theory_obtained: float
    annual_practical_max: float
    annual_practical_obtained: float
    annual_max_total: float
    annual_obtained_total: float

class ReportCardSignatures(BaseModel):
    class_teacher_name: str
    principal_name: str = "Principal"

class ReportCardResponse(BaseModel):
    header: ReportCardHeader
    student: ReportCardStudentInfo
    subjects_marks: List[StudentSubjectMarksRow]
    totals: ReportCardTotals
    result: str
    percentage: float
    division_grade: Optional[str] = None
    completion_status: str
    signatures: ReportCardSignatures
