# New Sunshine Public School — Result Management Portal (Session 2026-27)

A full-stack Examination & Result Management System designed and built for **New Sunshine Public School**, Indore (M.P.).

## School Information
- **Institution Name:** New Sunshine Public School
- **Address:** 25, 26 Yashoda Nagar, Behind Velocity Cinema, Indore
- **Institute Code:** 73181
- **DISE Code:** 23260103118
- **Academic Session:** 2026-27
- **Official Report Card:** Annual Examination Report Card

---

## Roles and Test Credentials

| Full Name | Role | Username | Password | Assigned Scope | Special Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ayush Upadhyay** | `SUPER_ADMIN` | `admin_ayush` | `Sunshine@2026` | All Classes | Full system authority & can update marks for any class |
| **Seema Upadhyay #1** | `PRINCIPAL` | `principal_seema` | `Sunshine@2026` | All Classes | Administrative authority & can update marks for any class |
| **Charoolata Joshi** | `CLASS_TEACHER` | `teacher_charoolata` | `Sunshine@2026` | Class IV | Has `VIEW_ALL_RESULTS` (Read-only view of all classes) |
| **Seema Upadhyay #2** | `CLASS_TEACHER` | `teacher_seema_kgi` | `Sunshine@2026` | Class KGI | Strictly confined to KGI (Separate account from Principal) |
| **Reena Verma** | `CLASS_TEACHER` | `teacher_reena` | `Sunshine@2026` | Class NUR | Confined to Class NUR |
| **Chaitali Pandey** | `CLASS_TEACHER` | `teacher_chaitali` | `Sunshine@2026` | Class KGII | Confined to Class KGII |
| **Chetna Solanki** | `CLASS_TEACHER` | `teacher_chetna` | `Sunshine@2026` | Class I | Confined to Class I |
| **Madhubala Singh** | `CLASS_TEACHER` | `teacher_madhubala` | `Sunshine@2026` | Class II | Confined to Class II |
| **Swati Singh** | `CLASS_TEACHER` | `teacher_swati` | `Sunshine@2026` | Class III | Confined to Class III |
| **Trupti Dhoble** | `CLASS_TEACHER` | `teacher_trupti` | `Sunshine@2026` | Class VI | Confined to Class VI |
| **Kiran Modi** | `CLASS_TEACHER` | `teacher_kiran` | `Sunshine@2026` | Class VII | Confined to Class VII |

---

## Key Features Implemented

1. **Strict Account Separation:**
   - Principal Seema Upadhyay (ID: 2) and KGI Teacher Seema Upadhyay (ID: 4) have separate database user records and credentials.
2. **Backend-Enforced Authorization:**
   - Backend routes check class write permissions. Direct API attempts to edit other classes return HTTP `403 Forbidden`.
3. **Class & Subject Mappings:**
   - 9 Classes (`NUR`, `KGI`, `KGII`, `I`, `II`, `III`, `IV`, `VI`, `VII` — **no Class V**).
   - Dynamic subject structures (3 for Pre-primary, 4 for Primary, 6 for Middle school).
4. **Separate Examination Storage & Auto-Calculations:**
   - Half-Yearly (Max, Obtained) and Annual (Theory Max 75, Theory Obt, Practical Max 25, Practical Obt).
   - Annual Total is **automatically calculated** ($\text{Theory} + \text{Practical}$) and locked from manual editing.
   - Percentage and Pass/Fail automatically evaluated; Division/Grade assigned by Class Teacher.
5. **A4 Report Card & Physical Signatures:**
   - Official School Logo header.
   - Dynamic subject table.
   - **Blank signature areas** for Class Teacher and Principal with a dedicated blank zone for the manual physical school seal.
   - Zero digital/fake signatures or stamps.
   - Built-in A4 Print & PDF Download.
6. **Excel / CSV Student Import:**
   - Import modal with live validation preview, duplicate detection, and commit.
7. **Audit Logging:**
   - Tracks all mark modifications and user actions.

---

## How to Run

Double click `start_server.bat` or run manually:

### Backend:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend:
```bash
cd frontend
npm run dev
```

Open browser at: `http://127.0.0.1:5173`
