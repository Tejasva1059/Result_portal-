from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.user import User, RoleEnum
from app.models.academic import Class, Subject, ClassSubject
from app.models.student import Student
from app.schemas.academic import ClassResponse, ClassSubjectResponse, ClassTeacherBrief

router = APIRouter(prefix="/classes", tags=["classes"])

@router.get("", response_model=List[ClassResponse])
def get_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    classes = db.query(Class).order_by(Class.display_order).all()
    results = []
    for cls in classes:
        # Count active students
        student_count = db.query(Student).filter(Student.class_id == cls.id, Student.is_active == True).count()
        
        # Teacher info
        teacher_brief = None
        if cls.assigned_teachers:
            t_profile = cls.assigned_teachers[0]
            teacher_brief = ClassTeacherBrief(
                user_id=t_profile.user.id,
                full_name=t_profile.user.full_name,
                designation=t_profile.designation
            )
        
        # Subjects info
        subj_list = []
        for cs in cls.class_subjects:
            subj_list.append(ClassSubjectResponse(
                id=cs.id,
                subject_id=cs.subject.id,
                subject_name=cs.subject.name,
                subject_code=cs.subject.code,
                display_order=cs.display_order,
                default_half_yearly_max=cs.default_half_yearly_max,
                default_annual_theory_max=cs.default_annual_theory_max,
                default_annual_practical_max=cs.default_annual_practical_max
            ))
        
        results.append(ClassResponse(
            id=cls.id,
            name=cls.name,
            display_order=cls.display_order,
            students_count=student_count,
            assigned_teacher=teacher_brief,
            subjects=subj_list
        ))
    return results

@router.get("/{class_id}", response_model=ClassResponse)
def get_class_by_id(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    student_count = db.query(Student).filter(Student.class_id == cls.id, Student.is_active == True).count()
    teacher_brief = None
    if cls.assigned_teachers:
        t_profile = cls.assigned_teachers[0]
        teacher_brief = ClassTeacherBrief(
            user_id=t_profile.user.id,
            full_name=t_profile.user.full_name,
            designation=t_profile.designation
        )
    subj_list = [
        ClassSubjectResponse(
            id=cs.id,
            subject_id=cs.subject.id,
            subject_name=cs.subject.name,
            subject_code=cs.subject.code,
            display_order=cs.display_order,
            default_half_yearly_max=cs.default_half_yearly_max,
            default_annual_theory_max=cs.default_annual_theory_max,
            default_annual_practical_max=cs.default_annual_practical_max
        )
        for cs in cls.class_subjects
    ]
    return ClassResponse(
        id=cls.id,
        name=cls.name,
        display_order=cls.display_order,
        students_count=student_count,
        assigned_teacher=teacher_brief,
        subjects=subj_list
    )
