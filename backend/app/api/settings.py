from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_super_admin, log_audit_action
from app.models.user import User
from app.models.settings import SchoolSetting
from app.schemas.settings import SchoolSettingResponse, SchoolSettingUpdate

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("", response_model=SchoolSettingResponse)
def get_school_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    setting = db.query(SchoolSetting).first()
    if not setting:
        setting = SchoolSetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.put("", response_model=SchoolSettingResponse)
def update_school_settings(
    body: SchoolSettingUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    setting = db.query(SchoolSetting).first()
    if not setting:
        setting = SchoolSetting()
        db.add(setting)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(setting, field, value)

    db.commit()
    db.refresh(setting)

    log_audit_action(
        db=db,
        user=admin,
        action="UPDATE_SETTINGS",
        entity_type="SETTINGS",
        details="Updated school settings configuration"
    )

    return setting
