from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, get_current_user, require_super_admin
from app.models.user import User
from app.models.academic import Subject
from app.schemas.academic import SubjectResponse, SubjectCreate

router = APIRouter(prefix="/subjects", tags=["subjects"])

@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Subject).all()

@router.post("", response_model=SubjectResponse)
def create_subject(
    body: SubjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    existing = db.query(Subject).filter(Subject.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject already exists")
    sb = Subject(name=body.name, code=body.code)
    db.add(sb)
    db.commit()
    db.refresh(sb)
    return sb
