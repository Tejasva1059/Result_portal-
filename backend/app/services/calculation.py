from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.academic import ClassSubject, Subject
from app.models.marks import Mark, ExamType
from app.models.result import Result, ResultStatus, PassFailStatus
from app.models.settings import SchoolSetting
from datetime import datetime, timezone
from typing import Dict, Any, List

def calculate_student_result(db: Session, student_id: int) -> Result:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student with id {student_id} not found")
    
    settings = db.query(SchoolSetting).first()
    passing_percentage = settings.passing_percentage if settings else 33.0
    subject_wise_min_rule = settings.subject_wise_min_rule if settings else True
    subject_min_percentage = settings.subject_min_percentage if settings else 33.0

    # Get all subjects for student's class
    class_subjects = (
        db.query(ClassSubject)
        .filter(ClassSubject.class_id == student.class_id)
        .order_by(ClassSubject.display_order)
        .all()
    )
    total_subjects_count = len(class_subjects)
    if total_subjects_count == 0:
        total_subjects_count = 1  # Avoid division by zero

    # Get all marks for student
    marks = db.query(Mark).filter(Mark.student_id == student_id).all()
    
    half_yearly_marks_dict = {
        m.subject_id: m for m in marks if m.exam_type == ExamType.HALF_YEARLY
    }
    annual_marks_dict = {
        m.subject_id: m for m in marks if m.exam_type == ExamType.ANNUAL
    }

    half_yearly_total_obtained = 0.0
    annual_total_obtained = 0.0
    annual_max_marks_total = 0.0
    
    half_yearly_entered_count = 0
    annual_entered_count = 0
    any_subject_failed = False

    for cs in class_subjects:
        # Half-yearly
        hy_mark = half_yearly_marks_dict.get(cs.subject_id)
        if hy_mark is not None and hy_mark.total_obtained is not None:
            half_yearly_total_obtained += hy_mark.total_obtained
            half_yearly_entered_count += 1
        
        # Annual
        ann_mark = annual_marks_dict.get(cs.subject_id)
        subject_ann_max = (cs.default_annual_theory_max + cs.default_annual_practical_max)
        annual_max_marks_total += subject_ann_max

        if ann_mark is not None and ann_mark.total_obtained is not None:
            annual_total_obtained += ann_mark.total_obtained
            annual_entered_count += 1
            
            # Check subject-wise minimum
            if subject_wise_min_rule:
                subj_perc = (ann_mark.total_obtained / subject_ann_max * 100.0) if subject_ann_max > 0 else 0
                if subj_perc < subject_min_percentage:
                    any_subject_failed = True

    # Calculate percentage
    percentage = 0.0
    if annual_max_marks_total > 0 and annual_entered_count > 0:
        percentage = round((annual_total_obtained / annual_max_marks_total) * 100.0, 2)

    # Determine completion status
    all_hy_entered = (half_yearly_entered_count == len(class_subjects))
    all_ann_entered = (annual_entered_count == len(class_subjects))

    if all_hy_entered and all_ann_entered:
        completion_status = ResultStatus.COMPLETE
    elif (half_yearly_entered_count > 0 or annual_entered_count > 0):
        completion_status = ResultStatus.IN_PROGRESS
    else:
        completion_status = ResultStatus.PENDING

    # Determine pass/fail
    pass_fail_status = None
    if completion_status == ResultStatus.COMPLETE:
        if percentage >= passing_percentage and not any_subject_failed:
            pass_fail_status = PassFailStatus.PASS
        else:
            pass_fail_status = PassFailStatus.FAIL

    # Update or create result record
    result = db.query(Result).filter(Result.student_id == student_id).first()
    if not result:
        result = Result(
            student_id=student_id,
            half_yearly_total=round(half_yearly_total_obtained, 2),
            annual_total=round(annual_total_obtained, 2),
            annual_max_marks=round(annual_max_marks_total, 2),
            percentage=percentage,
            pass_fail_status=pass_fail_status,
            completion_status=completion_status,
            updated_at=datetime.now(timezone.utc)
        )
        db.add(result)
    else:
        result.half_yearly_total = round(half_yearly_total_obtained, 2)
        result.annual_total = round(annual_total_obtained, 2)
        result.annual_max_marks = round(annual_max_marks_total, 2)
        result.percentage = percentage
        result.pass_fail_status = pass_fail_status
        result.completion_status = completion_status
        result.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(result)
    return result
