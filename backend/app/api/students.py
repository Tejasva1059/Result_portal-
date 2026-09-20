from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import csv
import io
import openpyxl
from app.api.deps import get_db, get_current_user, check_class_read_access, check_class_write_access, log_audit_action
from app.models.user import User, RoleEnum
from app.models.student import Student
from app.models.academic import Class
from app.models.result import Result, ResultStatus
from app.schemas.student import (
    StudentResponse,
    StudentCreate,
    StudentUpdate,
    StudentImportPreviewItem,
    StudentImportPreviewResponse
)

router = APIRouter(prefix="/students", tags=["students"])

def serialize_student(s: Student) -> StudentResponse:
    res = s.result
    return StudentResponse(
        id=s.id,
        class_id=s.class_id,
        class_name=s.student_class.name if s.student_class else None,
        student_name=s.student_name,
        father_name=s.father_name,
        mother_name=s.mother_name,
        date_of_birth=s.date_of_birth,
        contact_number=s.contact_number,
        scholar_number=s.scholar_number,
        roll_number=s.roll_number,
        address=s.address,
        is_active=s.is_active,
        created_at=s.created_at,
        updated_at=s.updated_at,
        completion_status=res.completion_status.value if res else "PENDING",
        percentage=res.percentage if res else 0.0,
        pass_fail_status=res.pass_fail_status.value if (res and res.pass_fail_status) else None
    )

@router.get("", response_model=List[StudentResponse])
def get_students(
    class_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Student).filter(Student.is_active == True)
    
    # Class scoping for normal class teachers
    if current_user.role == RoleEnum.CLASS_TEACHER:
        has_view_all = any(p.permission_code == "VIEW_ALL_RESULTS" for p in current_user.permissions)
        assigned_id = current_user.teacher_profile.assigned_class_id if current_user.teacher_profile else None
        
        if not has_view_all:
            # Strictly limit to assigned class
            if class_id and class_id != assigned_id:
                raise HTTPException(status_code=403, detail="Forbidden: You can only view students of your assigned class")
            query = query.filter(Student.class_id == assigned_id)
        elif class_id:
            query = query.filter(Student.class_id == class_id)
    else:
        if class_id:
            query = query.filter(Student.class_id == class_id)
            
    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            (Student.student_name.ilike(s_term)) |
            (Student.scholar_number.ilike(s_term)) |
            (Student.father_name.ilike(s_term))
        )
        
    students = query.order_by(Student.class_id, Student.roll_number).all()
    return [serialize_student(s) for s in students]

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    check_class_read_access(current_user, student.class_id)
    return serialize_student(student)

@router.post("", response_model=StudentResponse)
def create_student(
    body: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify write access for target class
    check_class_write_access(current_user, body.class_id)
    
    # Check duplicate roll number in same class
    existing_roll = db.query(Student).filter(
        Student.class_id == body.class_id,
        Student.roll_number == body.roll_number,
        Student.is_active == True
    ).first()
    if existing_roll:
        raise HTTPException(
            status_code=400,
            detail=f"Roll Number {body.roll_number} already exists in this class"
        )
        
    # Check scholar number if provided
    if body.scholar_number:
        existing_scholar = db.query(Student).filter(
            Student.scholar_number == body.scholar_number,
            Student.is_active == True
        ).first()
        if existing_scholar:
            raise HTTPException(
                status_code=400,
                detail=f"Scholar Number '{body.scholar_number}' is already assigned to {existing_scholar.student_name}"
            )

    student = Student(
        class_id=body.class_id,
        student_name=body.student_name.strip(),
        father_name=body.father_name.strip(),
        mother_name=body.mother_name.strip(),
        date_of_birth=body.date_of_birth,
        contact_number=body.contact_number,
        scholar_number=body.scholar_number.strip() if body.scholar_number else None,
        roll_number=body.roll_number,
        address=body.address,
        is_active=body.is_active
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Initialize empty result
    result = Result(
        student_id=student.id,
        completion_status=ResultStatus.PENDING
    )
    db.add(result)
    db.commit()
    db.refresh(student)

    log_audit_action(
        db=db,
        user=current_user,
        action="CREATE_STUDENT",
        entity_type="STUDENT",
        entity_id=student.id,
        student_name=student.student_name,
        class_name=student.student_class.name,
        details=f"Added student {student.student_name}, Roll {student.roll_number}"
    )

    return serialize_student(student)

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    body: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    check_class_write_access(current_user, student.class_id)
    if body.class_id and body.class_id != student.class_id:
        check_class_write_access(current_user, body.class_id)

    target_class_id = body.class_id or student.class_id
    target_roll = body.roll_number if body.roll_number is not None else student.roll_number

    if target_roll != student.roll_number or target_class_id != student.class_id:
        existing_roll = db.query(Student).filter(
            Student.class_id == target_class_id,
            Student.roll_number == target_roll,
            Student.id != student.id,
            Student.is_active == True
        ).first()
        if existing_roll:
            raise HTTPException(
                status_code=400,
                detail=f"Roll Number {target_roll} is already in use in this class"
            )

    if body.scholar_number and body.scholar_number != student.scholar_number:
        existing_scholar = db.query(Student).filter(
            Student.scholar_number == body.scholar_number,
            Student.id != student.id,
            Student.is_active == True
        ).first()
        if existing_scholar:
            raise HTTPException(
                status_code=400,
                detail=f"Scholar Number '{body.scholar_number}' is already assigned"
            )

    if body.class_id is not None:
        student.class_id = body.class_id
    if body.student_name is not None:
        student.student_name = body.student_name.strip()
    if body.father_name is not None:
        student.father_name = body.father_name.strip()
    if body.mother_name is not None:
        student.mother_name = body.mother_name.strip()
    if body.date_of_birth is not None:
        student.date_of_birth = body.date_of_birth
    if body.contact_number is not None:
        student.contact_number = body.contact_number
    if body.scholar_number is not None:
        student.scholar_number = body.scholar_number.strip()
    if body.roll_number is not None:
        student.roll_number = body.roll_number
    if body.address is not None:
        student.address = body.address
    if body.is_active is not None:
        student.is_active = body.is_active

    db.commit()
    db.refresh(student)

    log_audit_action(
        db=db,
        user=current_user,
        action="UPDATE_STUDENT",
        entity_type="STUDENT",
        entity_id=student.id,
        student_name=student.student_name,
        class_name=student.student_class.name,
        details=f"Updated details for student {student.student_name}"
    )

    return serialize_student(student)

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    check_class_write_access(current_user, student.class_id)
    
    student_name = student.student_name
    class_name = student.student_class.name

    db.delete(student)
    db.commit()

    log_audit_action(
        db=db,
        user=current_user,
        action="DELETE_STUDENT",
        entity_type="STUDENT",
        entity_id=student_id,
        student_name=student_name,
        class_name=class_name,
        details=f"Deleted student {student_name}"
    )

    return {"message": "Student deleted successfully"}

# ----------------- CSV / Excel Import -----------------

@router.post("/import/preview", response_model=StudentImportPreviewResponse)
async def preview_student_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    filename = file.filename.lower()
    
    rows = []
    if filename.endswith(".csv"):
        text = contents.decode("utf-8-sig", errors="replace")
        csv_reader = csv.DictReader(io.StringIO(text))
        for row in csv_reader:
            rows.append(row)
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        wb = openpyxl.load_workbook(filename=io.BytesIO(contents), data_only=True)
        sheet = wb.active
        headers = [str(cell.value).strip() if cell.value is not None else "" for cell in sheet[1]]
        for r in sheet.iter_rows(min_row=2, values_only=True):
            if any(r):
                row_dict = {headers[i]: (str(r[i]).strip() if r[i] is not None else "") for i in range(min(len(headers), len(r)))}
                rows.append(row_dict)
    else:
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv or .xlsx file")

    # Map classes
    classes = db.query(Class).all()
    class_name_map = {c.name.upper(): c for c in classes}

    preview_items = []
    seen_roll_per_class = set()
    seen_scholars = set()

    for idx, row in enumerate(rows, start=1):
        # Normalize keys
        row_norm = {k.lower().replace(" ", "").replace("_", ""): v for k, v in row.items()}
        
        c_name = row_norm.get("class", "").strip().upper()
        roll_raw = row_norm.get("rollnumber", row_norm.get("rollno", ""))
        scholar_raw = row_norm.get("scholarnumber", row_norm.get("scholarno", row_norm.get("sssid", "")))
        s_name = row_norm.get("studentname", row_norm.get("name", ""))
        f_name = row_norm.get("fathername", row_norm.get("father'sname", ""))
        m_name = row_norm.get("mothername", row_norm.get("mother'sname", ""))
        dob_raw = row_norm.get("dateofbirth", row_norm.get("dob", ""))
        contact_raw = row_norm.get("contactnumber", row_norm.get("contact", row_norm.get("phone", "")))
        addr_raw = row_norm.get("address", "")

        errors = []
        cls_obj = class_name_map.get(c_name)
        if not cls_obj:
            errors.append(f"Class '{c_name}' not found in system")

        try:
            roll_int = int(str(roll_raw).strip())
        except ValueError:
            roll_int = 0
            errors.append("Invalid or missing Roll Number")

        if not s_name:
            errors.append("Student Name is required")
        if not f_name:
            errors.append("Father's Name is required")
        if not m_name:
            errors.append("Mother's Name is required")

        # Check write permissions for the class
        if cls_obj and current_user.role == RoleEnum.CLASS_TEACHER:
            if current_user.teacher_profile and current_user.teacher_profile.assigned_class_id != cls_obj.id:
                errors.append(f"Not authorized to import into Class '{c_name}'")

        # Duplicate checks
        status_code = "VALID"
        if cls_obj and roll_int > 0:
            if (cls_obj.id, roll_int) in seen_roll_per_class:
                errors.append("Duplicate Roll Number in this import file")
                status_code = "DUPLICATE_ROLL"
            else:
                seen_roll_per_class.add((cls_obj.id, roll_int))
                
                # Check DB for existing roll
                db_roll = db.query(Student).filter(
                    Student.class_id == cls_obj.id,
                    Student.roll_number == roll_int,
                    Student.is_active == True
                ).first()
                if db_roll:
                    errors.append(f"Roll Number {roll_int} already exists in DB for Class {c_name}")
                    status_code = "DUPLICATE_ROLL"

        if scholar_raw:
            if scholar_raw in seen_scholars:
                errors.append("Duplicate Scholar Number in import file")
                status_code = "DUPLICATE_SCHOLAR"
            else:
                seen_scholars.add(scholar_raw)
                db_sch = db.query(Student).filter(
                    Student.scholar_number == scholar_raw,
                    Student.is_active == True
                ).first()
                if db_sch:
                    errors.append(f"Scholar Number '{scholar_raw}' already exists in DB")
                    status_code = "DUPLICATE_SCHOLAR"

        if errors and status_code == "VALID":
            status_code = "INVALID"

        preview_items.append(StudentImportPreviewItem(
            row_number=idx,
            class_id=cls_obj.id if cls_obj else None,
            class_name=c_name,
            roll_number=roll_int,
            scholar_number=scholar_raw if scholar_raw else None,
            student_name=s_name,
            father_name=f_name,
            mother_name=m_name,
            date_of_birth=dob_raw if dob_raw else None,
            contact_number=contact_raw if contact_raw else None,
            address=addr_raw if addr_raw else None,
            status=status_code,
            errors=errors
        ))

    valid_count = sum(1 for item in preview_items if item.status == "VALID")
    error_count = len(preview_items) - valid_count

    return StudentImportPreviewResponse(
        total_rows=len(preview_items),
        valid_count=valid_count,
        error_count=error_count,
        items=preview_items
    )

@router.post("/import/commit")
def commit_student_import(
    items: List[StudentImportPreviewItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    saved_students = []
    classes = {c.id: c for c in db.query(Class).all()}

    for item in items:
        if item.status != "VALID" or not item.class_id:
            continue
        
        check_class_write_access(current_user, item.class_id)
        
        # Parse DOB if present
        parsed_dob = None
        if item.date_of_birth:
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y"):
                try:
                    parsed_dob = datetime.strptime(str(item.date_of_birth).strip(), fmt).date()
                    break
                except ValueError:
                    pass

        student = Student(
            class_id=item.class_id,
            student_name=item.student_name.strip(),
            father_name=item.father_name.strip(),
            mother_name=item.mother_name.strip(),
            date_of_birth=parsed_dob,
            contact_number=item.contact_number,
            scholar_number=item.scholar_number.strip() if item.scholar_number else None,
            roll_number=item.roll_number,
            address=item.address,
            is_active=True
        )
        db.add(student)
        db.commit()
        db.refresh(student)

        # Initialize result
        db.add(Result(student_id=student.id, completion_status=ResultStatus.PENDING))
        saved_students.append(student)

    db.commit()

    log_audit_action(
        db=db,
        user=current_user,
        action="IMPORT_STUDENTS",
        entity_type="STUDENT",
        details=f"Imported {len(saved_students)} students into system"
    )

    return {"message": f"Successfully imported {len(saved_students)} students", "imported_count": len(saved_students)}
