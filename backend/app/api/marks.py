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
from app.models.academic import Class, Subject, ClassSubject
from app.models.marks import Mark, ExamType
from app.models.result import Result, ResultStatus
from app.schemas.marks import (
    BatchMarksEntryRequest,
    StudentMarksDetailResponse,
    StudentSubjectMarksRow,
    MarkResponse
)
from app.services.calculation import calculate_student_result

router = APIRouter(prefix="/marks", tags=["marks"])

@router.get("/student/{student_id}", response_model=StudentMarksDetailResponse)
def get_student_marks(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    check_class_read_access(current_user, student.class_id)

    class_subjects = (
        db.query(ClassSubject)
        .filter(ClassSubject.class_id == student.class_id)
        .order_by(ClassSubject.display_order)
        .all()
    )

    marks = db.query(Mark).filter(Mark.student_id == student_id).all()
    hy_dict = {m.subject_id: m for m in marks if m.exam_type == ExamType.HALF_YEARLY}
    ann_dict = {m.subject_id: m for m in marks if m.exam_type == ExamType.ANNUAL}

    rows = []
    hy_total_max = 0.0
    hy_total_obt = 0.0
    ann_th_total_obt = 0.0
    ann_pr_total_obt = 0.0
    ann_total_max = 0.0
    ann_total_obt = 0.0

    for cs in class_subjects:
        hy_mark = hy_dict.get(cs.subject_id)
        ann_mark = ann_dict.get(cs.subject_id)

        hy_max = cs.default_half_yearly_max
        hy_obt = hy_mark.total_obtained if hy_mark else None

        th_max = cs.default_annual_theory_max
        th_obt = ann_mark.theory_obtained if ann_mark else None
        pr_max = cs.default_annual_practical_max
        pr_obt = ann_mark.practical_obtained if ann_mark else None
        ann_max = th_max + pr_max
        ann_sub_total = ann_mark.total_obtained if ann_mark else None

        hy_total_max += hy_max
        if hy_obt is not None:
            hy_total_obt += hy_obt

        if th_obt is not None:
            ann_th_total_obt += th_obt
        if pr_obt is not None:
            ann_pr_total_obt += pr_obt

        ann_total_max += ann_max
        if ann_sub_total is not None:
            ann_total_obt += ann_sub_total

        rows.append(StudentSubjectMarksRow(
            subject_id=cs.subject.id,
            subject_name=cs.subject.name,
            display_order=cs.display_order,
            half_yearly_max=hy_max,
            half_yearly_obtained=hy_obt,
            annual_theory_max=th_max,
            annual_theory_obtained=th_obt,
            annual_practical_max=pr_max,
            annual_practical_obtained=pr_obt,
            annual_max=ann_max,
            annual_total_obtained=ann_sub_total
        ))

    # Get calculated result
    result = db.query(Result).filter(Result.student_id == student_id).first()
    if not result:
        result = calculate_student_result(db, student_id)

    return StudentMarksDetailResponse(
        student_id=student.id,
        student_name=student.student_name,
        roll_number=student.roll_number,
        scholar_number=student.scholar_number,
        class_id=student.class_id,
        class_name=student.student_class.name,
        rows=rows,
        half_yearly_total_max=hy_total_max,
        half_yearly_total_obtained=round(hy_total_obt, 2),
        annual_theory_total_obtained=round(ann_th_total_obt, 2),
        annual_practical_total_obtained=round(ann_pr_total_obt, 2),
        annual_total_max=ann_total_max,
        annual_total_obtained=round(ann_total_obt, 2),
        percentage=result.percentage,
        pass_fail_status=result.pass_fail_status.value if result.pass_fail_status else None,
        division_grade=result.division_grade,
        completion_status=result.completion_status.value
    )

@router.post("/batch")
def save_batch_marks(
    body: BatchMarksEntryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == body.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Strict class write access enforcement
    check_class_write_access(current_user, student.class_id)

    audit_changes = []

    for item in body.marks:
        subject = db.query(Subject).filter(Subject.id == item.subject_id).first()
        if not subject:
            continue

        existing_mark = db.query(Mark).filter(
            Mark.student_id == body.student_id,
            Mark.subject_id == item.subject_id,
            Mark.exam_type == body.exam_type
        ).first()

        if body.exam_type == ExamType.HALF_YEARLY:
            obt = item.obtained_marks
            if obt is not None:
                if obt < 0:
                    raise HTTPException(status_code=400, detail=f"Marks for {subject.name} cannot be negative")
                if obt > item.max_marks:
                    raise HTTPException(status_code=400, detail=f"Obtained marks ({obt}) for {subject.name} cannot exceed Maximum ({item.max_marks})")

            old_val = existing_mark.total_obtained if existing_mark else None
            if existing_mark:
                existing_mark.max_marks = item.max_marks
                existing_mark.total_obtained = obt if obt is not None else 0.0
                existing_mark.updated_by = current_user.id
                existing_mark.updated_at = datetime.now(timezone.utc)
            else:
                if obt is not None:
                    new_mark = Mark(
                        student_id=body.student_id,
                        subject_id=item.subject_id,
                        exam_type=ExamType.HALF_YEARLY,
                        max_marks=item.max_marks,
                        total_obtained=obt,
                        entered_by=current_user.id
                    )
                    db.add(new_mark)
            audit_changes.append(f"{subject.name} Half-Yearly: {old_val} -> {obt}")

        elif body.exam_type == ExamType.ANNUAL:
            th_obt = item.theory_obtained
            pr_obt = item.practical_obtained
            th_max = item.theory_max or 75.0
            pr_max = item.practical_max or 25.0

            if th_obt is not None:
                if th_obt < 0:
                    raise HTTPException(status_code=400, detail=f"Theory marks for {subject.name} cannot be negative")
                if th_obt > th_max:
                    raise HTTPException(status_code=400, detail=f"Theory marks ({th_obt}) for {subject.name} cannot exceed Theory Max ({th_max})")

            if pr_obt is not None:
                if pr_obt < 0:
                    raise HTTPException(status_code=400, detail=f"Practical/Internal marks for {subject.name} cannot be negative")
                if pr_obt > pr_max:
                    raise HTTPException(status_code=400, detail=f"Practical/Internal marks ({pr_obt}) for {subject.name} cannot exceed Practical Max ({pr_max})")

            # Automatic calculation of Annual Obtained Total: Theory + Practical
            # Only calculate if at least one is provided
            if th_obt is not None or pr_obt is not None:
                total_obt = (th_obt or 0.0) + (pr_obt or 0.0)
            else:
                total_obt = 0.0

            old_val = existing_mark.total_obtained if existing_mark else None
            if existing_mark:
                existing_mark.theory_max = th_max
                existing_mark.theory_obtained = th_obt
                existing_mark.practical_max = pr_max
                existing_mark.practical_obtained = pr_obt
                existing_mark.max_marks = th_max + pr_max
                existing_mark.total_obtained = total_obt
                existing_mark.updated_by = current_user.id
                existing_mark.updated_at = datetime.now(timezone.utc)
            else:
                if th_obt is not None or pr_obt is not None:
                    new_mark = Mark(
                        student_id=body.student_id,
                        subject_id=item.subject_id,
                        exam_type=ExamType.ANNUAL,
                        theory_max=th_max,
                        theory_obtained=th_obt,
                        practical_max=pr_max,
                        practical_obtained=pr_obt,
                        max_marks=th_max + pr_max,
                        total_obtained=total_obt,
                        entered_by=current_user.id
                    )
                    db.add(new_mark)
            audit_changes.append(f"{subject.name} Annual: Theory={th_obt}, Prac={pr_obt}, Total={total_obt}")

    db.commit()

    # Recalculate result
    result = calculate_student_result(db, student.id)
    if body.division_grade is not None:
        result.division_grade = body.division_grade.strip()
        result.finalized_by = current_user.id
        result.finalized_at = datetime.now(timezone.utc)
        db.commit()

    # Audit log
    log_audit_action(
        db=db,
        user=current_user,
        action=f"SAVE_{body.exam_type.value}_MARKS",
        entity_type="MARKS",
        entity_id=student.id,
        student_name=student.student_name,
        class_name=student.student_class.name,
        details="; ".join(audit_changes)
    )

    return {
        "message": f"Successfully saved {body.exam_type.value} marks for {student.student_name}",
        "completion_status": result.completion_status.value,
        "percentage": result.percentage,
        "pass_fail_status": result.pass_fail_status.value if result.pass_fail_status else None
    }

@router.get("/class-summary/{class_id}")
def get_class_marks_summary(
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
    class_subjects = db.query(ClassSubject).filter(ClassSubject.class_id == class_id).all()
    total_subjects = len(class_subjects)

    summary_items = []
    for s in students:
        marks = db.query(Mark).filter(Mark.student_id == s.id).all()
        hy_count = sum(1 for m in marks if m.exam_type == ExamType.HALF_YEARLY and m.total_obtained is not None)
        ann_count = sum(1 for m in marks if m.exam_type == ExamType.ANNUAL and m.total_obtained is not None)

        hy_status = "COMPLETE" if (total_subjects > 0 and hy_count == total_subjects) else ("IN_PROGRESS" if hy_count > 0 else "PENDING")
        ann_status = "COMPLETE" if (total_subjects > 0 and ann_count == total_subjects) else ("IN_PROGRESS" if ann_count > 0 else "PENDING")

        res = s.result
        overall_status = res.completion_status.value if res else "PENDING"
        
        summary_items.append({
            "student_id": s.id,
            "student_name": s.student_name,
            "roll_number": s.roll_number,
            "scholar_number": s.scholar_number,
            "half_yearly_status": hy_status,
            "half_yearly_entered": hy_count,
            "annual_status": ann_status,
            "annual_entered": ann_count,
            "total_subjects": total_subjects,
            "overall_status": overall_status,
            "percentage": res.percentage if res else 0.0,
            "pass_fail_status": res.pass_fail_status.value if (res and res.pass_fail_status) else None,
            "division_grade": res.division_grade if res else None
        })

    return {
        "class_id": cls.id,
        "class_name": cls.name,
        "total_students": len(students),
        "students": summary_items
    }
