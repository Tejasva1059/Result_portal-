from sqlalchemy import Column, Integer, String, Float, Boolean
from app.core.database import Base

class SchoolSetting(Base):
    __tablename__ = "school_settings"

    id = Column(Integer, primary_key=True, index=True)
    school_name = Column(String(150), default="NEW SUNSHINE PUBLIC SCHOOL")
    address = Column(String(255), default="25, 26 Yashoda Nagar, Behind Velocity Cinema, Indore")
    institute_code = Column(String(50), default="73181")
    dise_code = Column(String(50), default="23260103118")
    academic_session = Column(String(50), default="2026-27")
    report_card_title = Column(String(100), default="ANNUAL EXAMINATION REPORT CARD")
    
    # Configurable result rules
    passing_percentage = Column(Float, default=33.0)
    subject_wise_min_rule = Column(Boolean, default=True)
    subject_min_percentage = Column(Float, default=33.0)
    
    logo_url = Column(String(255), default="/static/school_logo.png")
