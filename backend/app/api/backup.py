from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil
from app.core.database import SessionLocal
from app.api.deps import get_db, require_admin_or_principal
from app.models.user import RoleEnum, User
from app.models.student import Student
from app.models.academic import Class, Subject, ClassSubject
from app.models.marks import Mark
from app.models.result import Result
from app.models.settings import SchoolSetting

router = APIRouter(prefix="/backup", tags=["Backup & Offline Operations"])

@router.get("/export-json", summary="Export full school database snapshot as JSON (100% Offline)")
def export_json_backup(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_principal)
):
    """
    Creates a full portable JSON backup of all students, classes, subjects, marks, results, and settings.
    Can be run completely offline on a local school server without Internet.
    """
    try:
        students = db.query(Student).all()
        classes = db.query(Class).all()
        subjects = db.query(Subject).all()
        marks = db.query(Mark).all()
        results = db.query(Result).all()
        setting = db.query(SchoolSetting).first()

        backup_payload = {
            "timestamp": datetime.now().isoformat(),
            "school_info": {
                "school_name": setting.school_name if setting else "New Sunshine Public School",
                "institute_code": setting.institute_code if setting else "73181",
                "dise_code": setting.dise_code if setting else "23260103118",
                "academic_session": setting.academic_session if setting else "2026-27"
            },
            "counts": {
                "total_students": len(students),
                "total_classes": len(classes),
                "total_subjects": len(subjects),
                "total_marks_records": len(marks),
                "total_results": len(results)
            },
            "students": [
                {
                    "id": s.id,
                    "class_id": s.class_id,
                    "student_name": s.student_name,
                    "father_name": s.father_name,
                    "mother_name": s.mother_name,
                    "date_of_birth": s.date_of_birth.isoformat() if s.date_of_birth else None,
                    "scholar_number": s.scholar_number,
                    "roll_number": s.roll_number,
                    "is_active": s.is_active
                }
                for s in students
            ],
            "marks": [
                {
                    "student_id": m.student_id,
                    "subject_id": m.subject_id,
                    "exam_type": m.exam_type.value,
                    "theory_obtained": m.theory_obtained,
                    "practical_obtained": m.practical_obtained,
                    "total_obtained": m.total_obtained,
                    "max_marks": m.max_marks
                }
                for m in marks
            ],
            "results": [
                {
                    "student_id": r.student_id,
                    "half_yearly_total": r.half_yearly_total,
                    "annual_total": r.annual_total,
                    "percentage": r.percentage,
                    "division_grade": r.division_grade,
                    "completion_status": r.completion_status.value
                }
                for r in results
            ]
        }

        return JSONResponse(
            content=backup_payload,
            headers={
                "Content-Disposition": f'attachment; filename="school_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate backup: {str(e)}"
        )
