from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User, RoleEnum, UserPermission, TeacherProfile
from app.models.academic import Class
from app.models.student import Student
from app.models.audit import AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return user

def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != RoleEnum.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Super Admin access required"
        )
    return current_user

def require_admin_or_principal(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in [RoleEnum.SUPER_ADMIN, RoleEnum.PRINCIPAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative access required"
        )
    return current_user

def check_class_write_access(current_user: User, class_id: int) -> bool:
    """
    SUPER_ADMIN and PRINCIPAL can update marks for ANY class.
    CLASS_TEACHER can update marks ONLY for their assigned class.
    Even CLASS_TEACHER with VIEW_ALL_RESULTS (e.g. Charoolata) CANNOT update other classes.
    """
    if current_user.role in [RoleEnum.SUPER_ADMIN, RoleEnum.PRINCIPAL]:
        return True
    
    if current_user.role == RoleEnum.CLASS_TEACHER:
        if current_user.teacher_profile and current_user.teacher_profile.assigned_class_id == class_id:
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: You are only permitted to update marks for your assigned class"
        )
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden: You do not have permission to update marks"
    )

def check_class_read_access(current_user: User, class_id: int) -> bool:
    """
    SUPER_ADMIN and PRINCIPAL can view all classes.
    CLASS_TEACHER with VIEW_ALL_RESULTS (e.g. Charoolata) can view all classes.
    Normal CLASS_TEACHER can view ONLY their assigned class.
    """
    if current_user.role in [RoleEnum.SUPER_ADMIN, RoleEnum.PRINCIPAL]:
        return True
    
    # Check if user has explicit VIEW_ALL_RESULTS permission
    has_view_all = any(p.permission_code == "VIEW_ALL_RESULTS" for p in current_user.permissions)
    if has_view_all:
        return True
    
    if current_user.role == RoleEnum.CLASS_TEACHER:
        if current_user.teacher_profile and current_user.teacher_profile.assigned_class_id == class_id:
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view results for this class"
        )
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden: Access denied"
    )

def log_audit_action(
    db: Session,
    user: User,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    student_name: Optional[str] = None,
    class_name: Optional[str] = None,
    subject_name: Optional[str] = None,
    details: Optional[str] = None
):
    try:
        log_entry = AuditLog(
            user_id=user.id if user else None,
            username=user.full_name if user else "System",
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            student_name=student_name,
            class_name=class_name,
            subject_name=subject_name,
            details=details
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging audit: {e}")
