from pydantic import BaseModel
from typing import Optional, List, Union
from app.models.marks import ExamType

class MarkEntryItem(BaseModel):
    subject_id: int
    exam_type: ExamType
    max_marks: float = 100.0
    
    # For Half-Yearly: directly obtained
    # For Annual: theory_obtained & practical_obtained
    theory_max: Optional[float] = 75.0
    theory_obtained: Optional[float] = None
    practical_max: Optional[float] = 25.0
    practical_obtained: Optional[float] = None
    
    # Direct obtained for Half Yearly or combined
    obtained_marks: Optional[float] = None

class BatchMarksEntryRequest(BaseModel):
    student_id: int
    exam_type: ExamType
    marks: List[MarkEntryItem]
    division_grade: Optional[str] = None

class MarkResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    subject_name: str
    subject_code: Optional[str] = None
    exam_type: ExamType
    max_marks: float
    theory_max: Optional[float] = None
    theory_obtained: Optional[float] = None
    practical_max: Optional[float] = None
    practical_obtained: Optional[float] = None
    total_obtained: float

    class Config:
        from_attributes = True

class StudentSubjectMarksRow(BaseModel):
    subject_id: int
    subject_name: str
    display_order: int
    
    # Half Yearly
    half_yearly_max: float
    half_yearly_obtained: Optional[float] = None
    
    # Annual
    annual_theory_max: float
    annual_theory_obtained: Optional[float] = None
    annual_practical_max: float
    annual_practical_obtained: Optional[float] = None
    annual_max: float
    annual_total_obtained: Optional[float] = None

class StudentMarksDetailResponse(BaseModel):
    student_id: int
    student_name: str
    roll_number: Union[str, int]
    scholar_number: Optional[str] = None
    class_id: int
    class_name: str
    rows: List[StudentSubjectMarksRow]
    
    # Totals
    half_yearly_total_max: float
    half_yearly_total_obtained: float
    annual_theory_total_obtained: float
    annual_practical_total_obtained: float
    annual_total_max: float
    annual_total_obtained: float
    
    percentage: float
    pass_fail_status: Optional[str] = None
    division_grade: Optional[str] = None
    completion_status: str
