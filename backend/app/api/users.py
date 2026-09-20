from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_db, get_current_user, require_super_admin, require_admin_or_principal, log_audit_action
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum, UserPermission, TeacherProfile
from app.models.academic import Class
from app.schemas.auth import UserResponse, UserCreate, UserUpdate, TeacherProfileResponse

router = APIRouter(prefix="/users", tags=["users"])

def serialize_user(user: User) -> UserResponse:
    profile_resp = None
    if user.teacher_profile:
        profile_resp = TeacherProfileResponse(
            id=user.teacher_profile.id,
            assigned_class_id=user.teacher_profile.assigned_class_id,
            assigned_class_name=user.teacher_profile.assigned_class.name if user.teacher_profile.assigned_class else None,
            designation=user.teacher_profile.designation,
            contact_number=user.teacher_profile.contact_number
        )
    perms = [p.permission_code for p in user.permissions]
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        teacher_profile=profile_resp,
        permissions=perms
    )

@router.get("", response_model=List[UserResponse])
def get_users(
    role: Optional[RoleEnum] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_principal)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.all()
    return [serialize_user(u) for u in users]

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_principal)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user)

@router.post("", response_model=UserResponse)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Username '{body.username}' is already taken")
    
    if body.email:
        existing_email = db.query(User).filter(User.email == body.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail=f"Email '{body.email}' is already registered")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=get_password_hash(body.password),
        full_name=body.full_name,
        role=body.role,
        is_active=body.is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Teacher profile if applicable
    if body.role == RoleEnum.CLASS_TEACHER or body.assigned_class_id is not None:
        profile = TeacherProfile(
            user_id=user.id,
            assigned_class_id=body.assigned_class_id,
            designation=body.designation or f"Class Teacher",
            contact_number=body.contact_number
        )
        db.add(profile)

    # Permissions
    for perm_code in body.permissions:
        db.add(UserPermission(user_id=user.id, permission_code=perm_code))

    db.commit()
    db.refresh(user)

    log_audit_action(
        db=db,
        user=admin,
        action="CREATE_USER",
        entity_type="USER",
        entity_id=user.id,
        details=f"Created user {user.username} with role {user.role}"
    )

    return serialize_user(user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.email is not None and body.email != user.email:
        existing = db.query(User).filter(User.email == body.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already taken")
        user.email = body.email

    if body.full_name is not None:
        user.full_name = body.full_name

    if body.role is not None:
        user.role = body.role

    if body.password:
        user.password_hash = get_password_hash(body.password)

    if body.is_active is not None:
        user.is_active = body.is_active

    # Handle teacher profile
    if body.assigned_class_id is not None or body.designation is not None or body.contact_number is not None:
        if not user.teacher_profile:
            profile = TeacherProfile(
                user_id=user.id,
                assigned_class_id=body.assigned_class_id,
                designation=body.designation,
                contact_number=body.contact_number
            )
            db.add(profile)
        else:
            if body.assigned_class_id is not None:
                user.teacher_profile.assigned_class_id = body.assigned_class_id
            if body.designation is not None:
                user.teacher_profile.designation = body.designation
            if body.contact_number is not None:
                user.teacher_profile.contact_number = body.contact_number

    # Permissions
    if body.permissions is not None:
        db.query(UserPermission).filter(UserPermission.user_id == user.id).delete()
        for perm_code in body.permissions:
            db.add(UserPermission(user_id=user.id, permission_code=perm_code))

    db.commit()
    db.refresh(user)

    log_audit_action(
        db=db,
        user=admin,
        action="UPDATE_USER",
        entity_type="USER",
        entity_id=user.id,
        details=f"Updated user {user.username}"
    )

    return serialize_user(user)

@router.put("/{user_id}/toggle-status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own super admin account")
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    log_audit_action(
        db=db,
        user=admin,
        action="TOGGLE_STATUS",
        entity_type="USER",
        entity_id=user.id,
        details=f"Set user {user.username} active status to {user.is_active}"
    )
    return serialize_user(user)
