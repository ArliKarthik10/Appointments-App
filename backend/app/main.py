from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from . import database, models, schemas, crud
from .auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
)
import datetime
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware




app = FastAPI(title="Appointment Backend")

#to integrate with frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#database initialization(connection to the database and creating tables)
@app.on_event("startup")
def startup():
    models.Base.metadata.create_all(bind=database.engine)


def get_db():
    yield from database.get_db()


@app.post("/doctors", response_model=schemas.DoctorOut)
def create_doctor(doc_in: schemas.DoctorCreate, db: Session = Depends(get_db)):  #depends work as middleware
    try:
        doc = crud.create_doctor(db, doc_in)
        return doc
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/patients", response_model=schemas.PatientOut)
def create_patient(pat_in: schemas.PatientCreate, db: Session = Depends(get_db)):
    try:
        pat = crud.create_patient(db, pat_in)
        return pat
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # form_data.username should be the email
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(
        data={
        "sub": user.email,
        "role": user.role,
        "id": user.id,   
        }
    )

    return {
    "access_token": access_token,
    "token_type": "bearer",
    "role": user.role,
    "is_verified": getattr(user, 'is_verified', 1)
    }



@app.get("/doctors")
def list_doctors(db: Session = Depends(get_db)):
    docs = crud.list_doctors(db)
    return [{"id": d.id, "name": d.name, "email": d.email} for d in docs]


@app.get("/doctors/{doctor_id}/availability")
def doctor_availability(doctor_id: int, date: str, db: Session = Depends(get_db)):
    try:
        date_obj = datetime.date.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid date format; use YYYY-MM-DD")

    doctor = crud.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="doctor not found")

    appts = crud.get_appointments_for_doctor_date(db, doctor_id, date_obj)
    booked = {a.slot: a for a in appts}
    slots = []
    for s in range(1, 5):
        if s in booked:
            a = booked[s]
            slots.append({"slot": s, "available": False, "appointment_id": a.id, "patient_id": a.patient_id})
        else:
            slots.append({"slot": s, "available": True, "appointment_id": None, "patient_id": None})
    return {"date": date_obj.isoformat(), "doctor_id": doctor_id, "slots": slots}


@app.post("/appointments/book", response_model=schemas.AppointmentOut)
def book_appointment(
    appt_in: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    # Only patients can book and patient_id must match the authenticated user
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="only patients can book appointments")
    if appt_in.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="patient_id must match authenticated user")
    try:
        appt = crud.create_appointment(db, appt_in)
        return appt
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError:
        # slot already taken or patient double-booking
        raise HTTPException(status_code=409, detail="slot already booked or patient double-booking")


@app.delete("/appointments/{appointment_id}", response_model=schemas.AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="appointment not found")
    # Only the assigned doctor can delete/cancel the appointment
    if current_user.role != "doctor" or appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="only the assigned doctor can cancel this appointment")
    
    # Check if doctor is verified (is_verified is 0 or 1 from database)
    if current_user.is_verified == 0:
        raise HTTPException(status_code=403, detail="Your account is not verified by admin yet. Please wait.")
    
    cancelled = crud.cancel_appointment(db, appointment_id)
    return cancelled


@app.get("/patients/me/appointments")
def patient_appointments(
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="forbidden")

    appts = crud.get_patient_appointments(db, current_user.id)
    return appts



@app.get("/doctors/me/appointments")
def doctor_appointments(
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="forbidden")
    
    # Check if doctor is verified (is_verified is 0 or 1 from database)
    if current_user.is_verified == 0:
        raise HTTPException(status_code=403, detail="Your account is not verified by admin yet. Please wait.")

    appts = (
        db.query(models.Appointment)
        .filter(models.Appointment.doctor_id == current_user.id)
        .all()
    )
    return appts


@app.post("/appointments/{appointment_id}/approve")
def approve_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    appt = db.query(models.Appointment).filter_by(id=appointment_id).first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role != "doctor" or appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    # Check if doctor is verified (is_verified is 0 or 1 from database)
    if current_user.is_verified == 0:
        raise HTTPException(status_code=403, detail="Your account is not verified by admin yet. Please wait.")

    appt.status = "BOOKED"
    db.commit()
    db.refresh(appt)
    return appt



@app.post("/appointments/{appointment_id}/reject")
def reject_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    appt = db.query(models.Appointment).filter_by(id=appointment_id).first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role != "doctor" or appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    # Check if doctor is verified (is_verified is 0 or 1 from database)
    if current_user.is_verified == 0:
        raise HTTPException(status_code=403, detail="Your account is not verified by admin yet. Please wait.")

    appt.status = "CANCELLED"
    db.commit()
    db.refresh(appt)
    return appt


@app.post("/doctors/register")
def register_doctor(data: schemas.DoctorCreate, db: Session = Depends(get_db)):
    doctor = models.Doctor(
        name=data.name,
        email=data.email,
        hashed_password=crud.get_password_hash(data.password),
        license_number=data.license_number,
        is_verified=0
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return {"message": "Doctor registered. Await admin verification"}


@app.get("/admin/pending-doctors")
def pending_doctors(
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    doctors = db.query(models.Doctor).filter(models.Doctor.is_verified == 0).all()
    return doctors


@app.put("/admin/verify-doctor/{doctor_id}")
def verify_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor.is_verified = 1
    db.commit()
    return {"message": "Doctor verified"}


@app.put("/admin/reject-doctor/{doctor_id}")
def reject_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor.is_verified = 2  # 2 = rejected
    db.commit()
    return {"message": "Doctor rejected"}


@app.get("/admin/all-doctors")
def get_all_doctors(
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    doctors = crud.get_all_doctors_with_status(db)
    return doctors


@app.post("/appointments/{appointment_id}/reschedule")
def reschedule_appointment(
    appointment_id: int,
    new_date: str = Query(...),
    new_slot: int = Query(...),
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="only patients can reschedule appointments")
    
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only reschedule your own appointments")
    
    if appt.status != "BOOKED":
        raise HTTPException(status_code=400, detail="Can only reschedule confirmed appointments")
    
    try:
        date_obj = datetime.date.fromisoformat(new_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format; use YYYY-MM-DD")
    
    try:
        updated_appt = crud.reschedule_appointment(db, appointment_id, date_obj, new_slot)
        return updated_appt
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError:
        raise HTTPException(status_code=409, detail="New slot already booked")


@app.post("/appointments/{appointment_id}/patient-cancel")
def patient_cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: object = Depends(get_current_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="only patients can cancel their appointments")
    
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own appointments")
    
    if appt.status != "BOOKED":
        raise HTTPException(status_code=400, detail="Can only cancel confirmed appointments")
    
    cancelled = crud.cancel_appointment(db, appointment_id)
    return cancelled
