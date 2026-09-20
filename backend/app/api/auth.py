from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import Token, UserResponse, LoginRequest, TeacherProfileResponse

router = APIRouter(prefix="/auth", tags=["auth"])

def format_user_response(user: User) -> UserResponse:
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

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    # Support both multipart/form-data (OAuth2 standard) and JSON body
    content_type = request.headers.get("content-type", "")
    username = ""
    password = ""
    
    if "application/json" in content_type:
        body = await request.json()
        username = body.get("username", "")
        password = body.get("password", "")
    else:
        form = await request.form()
        username = form.get("username", "")
        password = form.get("password", "")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated. Please contact Administrator."
        )

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=format_user_response(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return format_user_response(current_user)

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
