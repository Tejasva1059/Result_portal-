from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime
from app.models.result import ResultStatus, PassFailStatus

class ResultResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    roll_number: Optional[Union[str, int]] = None
    scholar_number: Optional[str] = None
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    half_yearly_total: float
    annual_total: float
    annual_max_marks: float
    percentage: float
    pass_fail_status: Optional[PassFailStatus] = None
    division_grade: Optional[str] = None
    completion_status: ResultStatus
    finalized_by: Optional[int] = None
    finalized_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class DivisionGradeUpdateRequest(BaseModel):
    division_grade: str

class ClassResultSummaryResponse(BaseModel):
    class_id: int
    class_name: str
    total_students: int
    completed_count: int
    in_progress_count: int
    pending_count: int
    passed_count: int
    failed_count: int
    results: List[ResultResponse]
