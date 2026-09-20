import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base
from app.api.deps import get_db
from app.services.seed_data import seed_database
from app.models.user import User, RoleEnum
from app.models.academic import Class, Subject, ClassSubject
from app.models.student import Student

# Use an in-memory SQLite database for automated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_school.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    # cleanup after tests if needed

client = TestClient(app)

def login_as(username: str, password: str = "Sunshine@2026"):
    resp = client.post("/api/auth/login", data={"username": username, "password": password})
    assert resp.status_code == 200, f"Login failed for {username}: {resp.text}"
    return resp.json()["access_token"]

def test_two_separate_seema_accounts():
    db = TestingSessionLocal()
    principal = db.query(User).filter(User.username == "principal_seema").first()
    kgi_teacher = db.query(User).filter(User.username == "teacher_seema_kgi").first()
    
    assert principal is not None, "Principal Seema account must exist"
    assert kgi_teacher is not None, "KGI Teacher Seema account must exist"
    assert principal.id != kgi_teacher.id, "Principal and Teacher Seema must have DIFFERENT User IDs"
    assert principal.role == RoleEnum.PRINCIPAL, "Principal must have PRINCIPAL role"
    assert kgi_teacher.role == RoleEnum.CLASS_TEACHER, "KGI Teacher must have CLASS_TEACHER role"
    assert kgi_teacher.teacher_profile.assigned_class.name == "KGI", "KGI Teacher must be assigned to KGI class"
    db.close()

def test_ayush_super_admin_full_access():
    token = login_as("admin_ayush")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Can get all classes
    resp = client.get("/api/classes", headers=headers)
    assert resp.status_code == 200
    classes = resp.json()
    assert len(classes) == 9  # NUR, KGI, KGII, I, II, III, IV, VI, VII (no Class V)

    # Can get any student marks
    db = TestingSessionLocal()
    class_vii_student = db.query(Student).join(Class).filter(Class.name == "VII").first()
    hindi_sub = db.query(Subject).filter(Subject.name == "Hindi").first()
    db.close()

    # Can update marks for Class VII student
    payload = {
        "student_id": class_vii_student.id,
        "exam_type": "ANNUAL",
        "marks": [
            {
                "subject_id": hindi_sub.id,
                "exam_type": "ANNUAL",
                "theory_max": 75.0,
                "theory_obtained": 60.0,
                "practical_max": 25.0,
                "practical_obtained": 20.0
            }
        ]
    }
    resp = client.post("/api/marks/batch", json=payload, headers=headers)
    assert resp.status_code == 200, f"Super Admin should be able to update any class marks: {resp.text}"

def test_principal_seema_can_update_any_class_marks():
    token = login_as("principal_seema")
    headers = {"Authorization": f"Bearer {token}"}
    
    db = TestingSessionLocal()
    class_vi_student = db.query(Student).join(Class).filter(Class.name == "VI").first()
    math_sub = db.query(Subject).filter(Subject.name == "Mathematics").first()
    db.close()

    payload = {
        "student_id": class_vi_student.id,
        "exam_type": "HALF_YEARLY",
        "marks": [
            {
                "subject_id": math_sub.id,
                "exam_type": "HALF_YEARLY",
                "max_marks": 100.0,
                "obtained_marks": 85.0
            }
        ]
    }
    resp = client.post("/api/marks/batch", json=payload, headers=headers)
    assert resp.status_code == 200, "Principal should be able to update marks for Class VI"

def test_kgi_teacher_seema_class_isolation():
    token = login_as("teacher_seema_kgi")
    headers = {"Authorization": f"Bearer {token}"}
    
    db = TestingSessionLocal()
    kgi_student = db.query(Student).join(Class).filter(Class.name == "KGI").first()
    class_iv_student = db.query(Student).join(Class).filter(Class.name == "IV").first()
    eng_sub = db.query(Subject).filter(Subject.name == "English").first()
    db.close()

    # Allowed for KGI
    payload_kgi = {
        "student_id": kgi_student.id,
        "exam_type": "HALF_YEARLY",
        "marks": [
            {
                "subject_id": eng_sub.id,
                "exam_type": "HALF_YEARLY",
                "max_marks": 100.0,
                "obtained_marks": 90.0
            }
        ]
    }
    resp = client.post("/api/marks/batch", json=payload_kgi, headers=headers)
    assert resp.status_code == 200, "KGI teacher should update KGI marks"

    # FORBIDDEN for Class IV
    payload_iv = {
        "student_id": class_iv_student.id,
        "exam_type": "HALF_YEARLY",
        "marks": [
            {
                "subject_id": eng_sub.id,
                "exam_type": "HALF_YEARLY",
                "max_marks": 100.0,
                "obtained_marks": 90.0
            }
        ]
    }
    resp = client.post("/api/marks/batch", json=payload_iv, headers=headers)
    assert resp.status_code == 403, "KGI teacher must NOT update Class IV marks"

def test_charoolata_special_view_all_and_class_iv_write():
    token = login_as("teacher_charoolata")
    headers = {"Authorization": f"Bearer {token}"}
    
    db = TestingSessionLocal()
    class_iv = db.query(Class).filter(Class.name == "IV").first()
    class_vi = db.query(Class).filter(Class.name == "VI").first()
    class_iv_student = db.query(Student).filter(Student.class_id == class_iv.id).first()
    class_vi_student = db.query(Student).filter(Student.class_id == class_vi.id).first()
    hindi_sub = db.query(Subject).filter(Subject.name == "Hindi").first()
    db.close()

    # Charoolata can view Class VI results (READ-ONLY)
    resp = client.get(f"/api/results/class/{class_vi.id}", headers=headers)
    assert resp.status_code == 200, "Charoolata with VIEW_ALL_RESULTS should be able to view Class VI results"

    # Charoolata CANNOT update Class VI marks -> 403 Forbidden
    payload_vi = {
        "student_id": class_vi_student.id,
        "exam_type": "HALF_YEARLY",
        "marks": [
            {
                "subject_id": hindi_sub.id,
                "exam_type": "HALF_YEARLY",
                "max_marks": 100.0,
                "obtained_marks": 80.0
            }
        ]
    }
    resp = client.post("/api/marks/batch", json=payload_vi, headers=headers)
    assert resp.status_code == 403, "Charoolata MUST NOT update Class VI marks"

    # Charoolata CAN update Class IV marks -> 200 OK
    payload_iv = {
        "student_id": class_iv_student.id,
        "exam_type": "HALF_YEARLY",
        "marks": [
            {
                "subject_id": hindi_sub.id,
                "exam_type": "HALF_YEARLY",
                "max_marks": 100.0,
                "obtained_marks": 88.0
            }
        ]
    }
    resp = client.post("/api/marks/batch", json=payload_iv, headers=headers)
    assert resp.status_code == 200, "Charoolata should be able to update Class IV marks"

def test_annual_marks_theory_practical_auto_calculation():
    token = login_as("teacher_reena")  # NUR teacher
    headers = {"Authorization": f"Bearer {token}"}
    
    db = TestingSessionLocal()
    nur_student = db.query(Student).join(Class).filter(Class.name == "NUR").first()
    eng_sub = db.query(Subject).filter(Subject.name == "English").first()
    db.close()

    # Enter Annual Theory=45, Practical=18 -> Expected Annual Total = 63
    payload = {
        "student_id": nur_student.id,
        "exam_type": "ANNUAL",
        "marks": [
            {
                "subject_id": eng_sub.id,
                "exam_type": "ANNUAL",
                "theory_max": 75.0,
                "theory_obtained": 45.0,
                "practical_max": 25.0,
                "practical_obtained": 18.0
            }
        ]
    }
    resp = client.post("/api/marks/batch", json=payload, headers=headers)
    assert resp.status_code == 200

    # Verify calculated marks in details API
    resp_details = client.get(f"/api/marks/student/{nur_student.id}", headers=headers)
    assert resp_details.status_code == 200
    data = resp_details.json()
    eng_row = next(r for r in data["rows"] if r["subject_name"] == "English")
    assert eng_row["annual_theory_obtained"] == 45.0
    assert eng_row["annual_practical_obtained"] == 18.0
    assert eng_row["annual_total_obtained"] == 63.0  # 45 + 18 = 63
