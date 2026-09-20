from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.api.deps import (
    get_db,
    get_current_user,
    check_class_read_access,
    check_class_write_access,
    log_audit_action
)
from app.models.user import User, RoleEnum
from app.models.student import Student
from app.models.academic import Class
from app.models.result import Result, ResultStatus, PassFailStatus
from app.schemas.result import (
    ResultResponse,
    DivisionGradeUpdateRequest,
    ClassResultSummaryResponse
)
from app.services.calculation import calculate_student_result

router = APIRouter(prefix="/results", tags=["results"])

def serialize_result(r: Result) -> ResultResponse:
    s = r.student
    return ResultResponse(
        id=r.id,
        student_id=r.student_id,
        student_name=s.student_name if s else None,
        roll_number=s.roll_number if s else None,
        scholar_number=s.scholar_number if s else None,
        class_id=s.class_id if s else None,
        class_name=s.student_class.name if (s and s.student_class) else None,
        half_yearly_total=r.half_yearly_total,
        annual_total=r.annual_total,
        annual_max_marks=r.annual_max_marks,
        percentage=r.percentage,
        pass_fail_status=r.pass_fail_status,
        division_grade=r.division_grade,
        completion_status=r.completion_status,
        finalized_by=r.finalized_by,
        finalized_at=r.finalized_at,
        updated_at=r.updated_at
    )

@router.get("/class/{class_id}", response_model=ClassResultSummaryResponse)
def get_class_results(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    check_class_read_access(current_user, class_id)

    students = (
        db.query(Student)
        .filter(Student.class_id == class_id, Student.is_active == True)
        .order_by(Student.roll_number)
        .all()
    )

    result_items = []
    completed = 0
    in_progress = 0
    pending = 0
    passed = 0
    failed = 0

    for s in students:
        r = s.result
        if not r:
            r = calculate_student_result(db, s.id)
        
        if r.completion_status == ResultStatus.COMPLETE:
            completed += 1
            if r.pass_fail_status == PassFailStatus.PASS:
                passed += 1
            elif r.pass_fail_status == PassFailStatus.FAIL:
                failed += 1
        elif r.completion_status == ResultStatus.IN_PROGRESS:
            in_progress += 1
        else:
            pending += 1

        result_items.append(serialize_result(r))

    return ClassResultSummaryResponse(
        class_id=cls.id,
        class_name=cls.name,
        total_students=len(students),
        completed_count=completed,
        in_progress_count=in_progress,
        pending_count=pending,
        passed_count=passed,
        failed_count=failed,
        results=result_items
    )

@router.get("/all-classes")
def get_all_classes_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Available for SUPER_ADMIN, PRINCIPAL, or CLASS_TEACHER with VIEW_ALL_RESULTS (e.g. Charoolata Joshi).
    Forbidden for normal teachers.
    """
    has_view_all = any(p.permission_code == "VIEW_ALL_RESULTS" for p in current_user.permissions)
    is_admin = current_user.role in [RoleEnum.SUPER_ADMIN, RoleEnum.PRINCIPAL]

    if not is_admin and not has_view_all:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view all class results"
        )

    classes = db.query(Class).order_by(Class.display_order).all()
    overview = []

    for cls in classes:
        students = db.query(Student).filter(Student.class_id == cls.id, Student.is_active == True).all()
        completed = 0
        passed = 0
        failed = 0
        total = len(students)

        for s in students:
            if s.result:
                if s.result.completion_status == ResultStatus.COMPLETE:
                    completed += 1
                    if s.result.pass_fail_status == PassFailStatus.PASS:
                        passed += 1
                    elif s.result.pass_fail_status == PassFailStatus.FAIL:
                        failed += 1

        # Check if current user has edit permission for this specific class
        can_edit = is_admin or (
            current_user.role == RoleEnum.CLASS_TEACHER and 
            current_user.teacher_profile and 
            current_user.teacher_profile.assigned_class_id == cls.id
        )

        overview.append({
            "class_id": cls.id,
            "class_name": cls.name,
            "total_students": total,
            "completed_results": completed,
            "passed_count": passed,
            "failed_count": failed,
            "can_edit_marks": can_edit
        })

    return overview

@router.put("/student/{student_id}/division-grade")
def update_division_grade(
    student_id: int,
    body: DivisionGradeUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    check_class_write_access(current_user, student.class_id)

    result = db.query(Result).filter(Result.student_id == student_id).first()
    if not result:
        result = calculate_student_result(db, student_id)

    old_val = result.division_grade
    result.division_grade = body.division_grade.strip()
    result.finalized_by = current_user.id
    result.finalized_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(result)

    log_audit_action(
        db=db,
        user=current_user,
        action="UPDATE_DIVISION_GRADE",
        entity_type="RESULT",
        entity_id=result.id,
        student_name=student.student_name,
        class_name=student.student_class.name,
        details=f"Division/Grade changed from '{old_val}' to '{result.division_grade}'"
    )

    return serialize_result(result)

@router.post("/student/{student_id}/recalculate", response_model=ResultResponse)
def recalculate_result(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    check_class_write_access(current_user, student.class_id)
    res = calculate_student_result(db, student_id)
    return serialize_result(res)
