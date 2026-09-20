import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.services.seed_data import seed_database
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.classes import router as classes_router
from app.api.subjects import router as subjects_router
from app.api.students import router as students_router
from app.api.marks import router as marks_router
from app.api.results import router as results_router
from app.api.report_cards import router as report_cards_router
from app.api.settings import router as settings_router
from app.api.audit import router as audit_router
from app.api.backup import router as backup_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack Result Management System for New Sunshine Public School, Indore",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for school logo and assets
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(classes_router, prefix=settings.API_V1_STR)
app.include_router(subjects_router, prefix=settings.API_V1_STR)
app.include_router(students_router, prefix=settings.API_V1_STR)
app.include_router(marks_router, prefix=settings.API_V1_STR)
app.include_router(results_router, prefix=settings.API_V1_STR)
app.include_router(report_cards_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(backup_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "message": "New Sunshine Public School Result Management Portal API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }
