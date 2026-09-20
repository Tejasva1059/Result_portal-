from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import date, datetime

class StudentBase(BaseModel):
    class_id: int
    student_name: str
    father_name: str
    mother_name: str
    date_of_birth: Optional[date] = None
    contact_number: Optional[str] = None
    scholar_number: Optional[str] = None
    roll_number: Union[str, int]
    address: Optional[str] = None
    is_active: bool = True

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    class_id: Optional[int] = None
    student_name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    contact_number: Optional[str] = None
    scholar_number: Optional[str] = None
    roll_number: Optional[Union[str, int]] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class StudentResponse(StudentBase):
    id: int
    class_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completion_status: Optional[str] = "PENDING"
    percentage: Optional[float] = 0.0
    pass_fail_status: Optional[str] = None

    class Config:
        from_attributes = True

class StudentImportRow(BaseModel):
    class_name: str
    roll_number: Union[str, int]
    scholar_number: Optional[str] = None
    student_name: str
    father_name: str
    mother_name: str
    date_of_birth: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None

class StudentImportPreviewItem(BaseModel):
    row_number: int
    class_id: Optional[int] = None
    class_name: str
    roll_number: Union[str, int]
    scholar_number: Optional[str] = None
    student_name: str
    father_name: str
    mother_name: str
    date_of_birth: Optional[str] = None
    contact_number: Optional[str] = None
    address: Optional[str] = None
    status: str
    errors: List[str] = []

class StudentImportPreviewResponse(BaseModel):
    total_rows: int
    valid_count: int
    error_count: int
    items: List[StudentImportPreviewItem]
