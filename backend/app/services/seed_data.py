from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum, UserPermission, TeacherProfile
from app.models.academic import Class, Subject, ClassSubject
from app.models.student import Student
from app.models.marks import Mark, ExamType
from app.models.result import Result, ResultStatus, PassFailStatus
from app.models.settings import SchoolSetting
from app.services.calculation import calculate_student_result
from datetime import date

def seed_database(db: Session = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. School Settings
        setting = db.query(SchoolSetting).first()
        if not setting:
            setting = SchoolSetting(
                school_name="NEW SUNSHINE PUBLIC SCHOOL",
                address="25, 26 Yashoda Nagar, Behind Velocity Cinema, Indore",
                institute_code="73181",
                dise_code="23260103118",
                academic_session="2026-27",
                report_card_title="ANNUAL EXAMINATION REPORT CARD",
                passing_percentage=33.0,
                subject_wise_min_rule=True,
                subject_min_percentage=33.0,
                logo_url="/static/school_logo.png"
            )
            db.add(setting)
            db.commit()

        # 2. Classes (NO Class V per specification)
        class_names = [
            ("NUR", 1),
            ("KGI", 2),
            ("KGII", 3),
            ("I", 4),
            ("II", 5),
            ("III", 6),
            ("IV", 7),
            ("VI", 8),
            ("VII", 9),
        ]
        class_map = {}
        for cname, order in class_names:
            cls = db.query(Class).filter(Class.name == cname).first()
            if not cls:
                cls = Class(name=cname, display_order=order)
                db.add(cls)
                db.commit()
                db.refresh(cls)
            class_map[cname] = cls

        # 3. Subjects
        subject_names = [
            ("English", "ENG"),
            ("Hindi", "HIN"),
            ("Mathematics", "MATH"),
            ("EVS", "EVS"),
            ("Science", "SCI"),
            ("Social Science", "SOC_SCI"),
            ("Sanskrit", "SKT"),
        ]
        subject_map = {}
        for sname, scode in subject_names:
            sb = db.query(Subject).filter(Subject.name == sname).first()
            if not sb:
                sb = Subject(name=sname, code=scode)
                db.add(sb)
                db.commit()
                db.refresh(sb)
            subject_map[sname] = sb

        # 4. Class-Subject Mappings
        # NUR, KGI, KGII: English, Hindi, Mathematics
        # Class I, II, III, IV: Hindi, English, Mathematics, EVS
        # Class VI, VII: Hindi, English, Mathematics, Science, Social Science, Sanskrit
        class_subject_rules = {
            "NUR": ["English", "Hindi", "Mathematics"],
            "KGI": ["English", "Hindi", "Mathematics"],
            "KGII": ["English", "Hindi", "Mathematics"],
            "I": ["Hindi", "English", "Mathematics", "EVS"],
            "II": ["Hindi", "English", "Mathematics", "EVS"],
            "III": ["Hindi", "English", "Mathematics", "EVS"],
            "IV": ["Hindi", "English", "Mathematics", "EVS"],
            "VI": ["Hindi", "English", "Mathematics", "Science", "Social Science", "Sanskrit"],
            "VII": ["Hindi", "English", "Mathematics", "Science", "Social Science", "Sanskrit"],
        }

        for cname, subj_list in class_subject_rules.items():
            cls = class_map[cname]
            for order, sname in enumerate(subj_list, 1):
                sb = subject_map[sname]
                cs = db.query(ClassSubject).filter(
                    ClassSubject.class_id == cls.id,
                    ClassSubject.subject_id == sb.id
                ).first()
                if not cs:
                    cs = ClassSubject(
                        class_id=cls.id,
                        subject_id=sb.id,
                        display_order=order,
                        default_half_yearly_max=100.0,
                        default_annual_theory_max=75.0,
                        default_annual_practical_max=25.0
                    )
                    db.add(cs)
        db.commit()

        # 5. Users & Roles
        # 5a. Super Admin: Ayush Upadhyay
        ayush = db.query(User).filter((User.username == "admin.ayush") | (User.username == "admin_ayush")).first()
        if not ayush:
            ayush = User(
                username="admin.ayush",
                email="ayush@newsunshineschool.edu",
                password_hash=get_password_hash("nsps@2016"),
                full_name="Ayush Upadhyay",
                role=RoleEnum.SUPER_ADMIN,
                is_active=True
            )
            db.add(ayush)
            db.commit()
            db.refresh(ayush)
            for perm in ["MANAGE_SYSTEM", "MANAGE_USERS", "MANAGE_STUDENTS", "UPDATE_ALL_MARKS", "VIEW_ALL_RESULTS"]:
                db.add(UserPermission(user_id=ayush.id, permission_code=perm))
            db.commit()
        else:
            ayush.username = "admin.ayush"
            ayush.password_hash = get_password_hash("nsps@2016")
            db.commit()

        # 5b. Principal: Seema Upadhyay (Seema #1)
        seema_principal = db.query(User).filter((User.username == "principal.seema") | (User.username == "principal_seema")).first()
        if not seema_principal:
            seema_principal = User(
                username="principal.seema",
                email="principal@newsunshineschool.edu",
                password_hash=get_password_hash("NewSunshine@2016"),
                full_name="Seema Upadhyay",
                role=RoleEnum.PRINCIPAL,
                is_active=True
            )
            db.add(seema_principal)
            db.commit()
            db.refresh(seema_principal)
            for perm in ["VIEW_ADMIN_DATA", "UPDATE_ALL_MARKS", "VIEW_ALL_RESULTS", "GENERATE_REPORT_CARDS"]:
                db.add(UserPermission(user_id=seema_principal.id, permission_code=perm))
            db.commit()
        else:
            seema_principal.username = "principal.seema"
            seema_principal.password_hash = get_password_hash("NewSunshine@2016")
            db.commit()

        # 5c. Teachers mapping
        teachers_data = [
            ("teacher.nursery", "teacher_reena", "Reena Verma", "NUR", "Rv@classnur", "reena@newsunshineschool.edu", []),
            ("teacher.kgi", "teacher_seema_kgi", "Seema Upadhyay", "KGI", "Su@classkgi", "seema.kgi@newsunshineschool.edu", []),
            ("teacher.kgii", "teacher_chaitali", "Chaitali Pandey", "KGII", "Cp@classkgii", "chaitali@newsunshineschool.edu", []),
            ("teacher.class1", "teacher_chetna", "Chetna Solanki", "I", "Cs@class1", "chetna@newsunshineschool.edu", []),
            ("teacher.class2", "teacher_madhubala", "Madhubala Singh", "II", "Ms@class2", "madhubala@newsunshineschool.edu", []),
            ("teacher.class3", "teacher_swati", "Swati Singh", "III", "Ss@class3", "swati@newsunshineschool.edu", []),
            ("teacher.class4", "teacher_charoolata", "Charoolata Joshi", "IV", "Cj@class4", "charoolata@newsunshineschool.edu", ["VIEW_ALL_RESULTS"]),
            ("teacher.class6", "teacher_trupti", "Trupti Dhoble", "VI", "Td@class6", "trupti@newsunshineschool.edu", []),
            ("teacher.class7", "teacher_kiran", "Kiran Modi", "VII", "Km@class7", "kiran@newsunshineschool.edu", []),
        ]

        for username, old_un, full_name, cname, pwd, email, extra_perms in teachers_data:
            user = db.query(User).filter((User.username == username) | (User.username == old_un)).first()
            cls = class_map.get(cname)
            if not user:
                user = User(
                    username=username,
                    email=email,
                    password_hash=get_password_hash(pwd),
                    full_name=full_name,
                    role=RoleEnum.CLASS_TEACHER,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)

                # Teacher Profile
                profile = TeacherProfile(
                    user_id=user.id,
                    assigned_class_id=cls.id if cls else None,
                    designation=f"Class Teacher ({cname})",
                    contact_number="9876543210"
                )
                db.add(profile)

                # Permissions
                for p in extra_perms:
                    db.add(UserPermission(user_id=user.id, permission_code=p))
                db.commit()
            else:
                user.username = username
                user.password_hash = get_password_hash(pwd)
                db.commit()


        # 6. Real Students (217 Total from Official Roster)
        from app.services.import_real_students import import_all_students
        import_all_students(db)

        print("Database seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_database()
