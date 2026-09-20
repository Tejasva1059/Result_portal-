from pydantic import BaseModel
from typing import Optional

class SchoolSettingResponse(BaseModel):
    id: int
    school_name: str
    address: str
    institute_code: str
    dise_code: str
    academic_session: str
    report_card_title: str
    passing_percentage: float
    subject_wise_min_rule: bool
    subject_min_percentage: float
    logo_url: str

    class Config:
        from_attributes = True

class SchoolSettingUpdate(BaseModel):
    school_name: Optional[str] = None
    address: Optional[str] = None
    institute_code: Optional[str] = None
    dise_code: Optional[str] = None
    academic_session: Optional[str] = None
    report_card_title: Optional[str] = None
    passing_percentage: Optional[float] = None
    subject_wise_min_rule: Optional[bool] = None
    subject_min_percentage: Optional[float] = None
    logo_url: Optional[str] = None
