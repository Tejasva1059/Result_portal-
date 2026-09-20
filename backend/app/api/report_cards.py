from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_db, get_current_user, check_class_read_access
from app.models.user import User
from app.models.student import Student
from app.models.academic import Class, ClassSubject
from app.models.marks import Mark, ExamType
from app.models.result import Result, ResultStatus
from app.models.settings import SchoolSetting
from app.schemas.marks import StudentSubjectMarksRow
from app.schemas.report_card import (
    ReportCardResponse,
    ReportCardHeader,
    ReportCardStudentInfo,
    ReportCardTotals,
    ReportCardSignatures
)
from app.services.calculation import calculate_student_result

router = APIRouter(prefix="/report-cards", tags=["report-cards"])

def build_report_card_payload(db: Session, student: Student) -> ReportCardResponse:
    setting = db.query(SchoolSetting).first()
    header = ReportCardHeader(
        school_name=setting.school_name if setting else "NEW SUNSHINE PUBLIC SCHOOL",
        address=setting.address if setting else "25, 26 Yashoda Nagar, Behind Velocity Cinema, Indore",
        institute_code=setting.institute_code if setting else "73181",
        dise_code=setting.dise_code if setting else "23260103118",
        academic_session=setting.academic_session if setting else "2026-27",
        report_card_title=setting.report_card_title if setting else "ANNUAL EXAMINATION REPORT CARD",
        logo_url=setting.logo_url if setting else "/static/school_logo.png"
    )

    student_info = ReportCardStudentInfo(
        id=student.id,
        student_name=student.student_name,
        father_name=student.father_name,
        mother_name=student.mother_name,
        date_of_birth=student.date_of_birth,
        contact_number=student.contact_number,
        scholar_number=student.scholar_number,
        roll_number=student.roll_number,
        class_name=student.student_class.name,
        address=student.address
    )

    # Class subjects
    class_subjects = (
        db.query(ClassSubject)
        .filter(ClassSubject.class_id == student.class_id)
        .order_by(ClassSubject.display_order)
        .all()
    )

    marks = db.query(Mark).filter(Mark.student_id == student.id).all()
    hy_dict = {m.subject_id: m for m in marks if m.exam_type == ExamType.HALF_YEARLY}
    ann_dict = {m.subject_id: m for m in marks if m.exam_type == ExamType.ANNUAL}

    subject_rows = []
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

        subject_rows.append(StudentSubjectMarksRow(
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

    totals = ReportCardTotals(
        half_yearly_max=hy_total_max,
        half_yearly_obtained=round(hy_total_obt, 2),
        annual_theory_max=sum(cs.default_annual_theory_max for cs in class_subjects),
        annual_theory_obtained=round(ann_th_total_obt, 2),
        annual_practical_max=sum(cs.default_annual_practical_max for cs in class_subjects),
        annual_practical_obtained=round(ann_pr_total_obt, 2),
        annual_max_total=ann_total_max,
        annual_obtained_total=round(ann_total_obt, 2)
    )

    res = student.result
    if not res:
        res = calculate_student_result(db, student.id)

    # Status check
    if res.completion_status != ResultStatus.COMPLETE:
        result_text = "RESULT PENDING"
    else:
        result_text = res.pass_fail_status.value if res.pass_fail_status else "PASS"

    # Class Teacher Name
    teacher_name = "Class Teacher"
    if student.student_class and student.student_class.assigned_teachers:
        teacher_name = student.student_class.assigned_teachers[0].user.full_name

    signatures = ReportCardSignatures(
        class_teacher_name=teacher_name,
        principal_name="Principal"
    )

    return ReportCardResponse(
        header=header,
        student=student_info,
        subjects_marks=subject_rows,
        totals=totals,
        result=result_text,
        percentage=res.percentage,
        division_grade=res.division_grade,
        completion_status=res.completion_status.value,
        signatures=signatures
    )

@router.get("/student/{student_id}", response_model=ReportCardResponse)
def get_student_report_card(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    check_class_read_access(current_user, student.class_id)
    return build_report_card_payload(db, student)

@router.get("/class/{class_id}", response_model=List[ReportCardResponse])
def get_class_report_cards(
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

    return [build_report_card_payload(db, s) for s in students]
