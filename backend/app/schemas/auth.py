from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.user import RoleEnum

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: str
    role: RoleEnum
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    assigned_class_id: Optional[int] = None
    designation: Optional[str] = None
    contact_number: Optional[str] = None
    permissions: List[str] = []

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_class_id: Optional[int] = None
    designation: Optional[str] = None
    contact_number: Optional[str] = None
    permissions: Optional[List[str]] = None

class TeacherProfileResponse(BaseModel):
    id: int
    assigned_class_id: Optional[int] = None
    assigned_class_name: Optional[str] = None
    designation: Optional[str] = None
    contact_number: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    created_at: datetime
    teacher_profile: Optional[TeacherProfileResponse] = None
    permissions: List[str] = []

    class Config:
        from_attributes = True

Token.model_rebuild()
