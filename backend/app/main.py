from fastapi import FastAPI, Depends, HTTPException, status
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

app = FastAPI(title="Appointment Backend")


@app.on_event("startup")
def startup():
    models.Base.metadata.create_all(bind=database.engine)


def get_db():
    yield from database.get_db()


@app.post("/doctors", response_model=schemas.DoctorOut)
def create_doctor(doc_in: schemas.DoctorCreate, db: Session = Depends(get_db)):
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
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


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
    cancelled = crud.cancel_appointment(db, appointment_id)
    return cancelled


@app.get("/patients/{patient_id}/appointments")
def patient_appointments(
    patient_id: int, db: Session = Depends(get_db), current_user: object = Depends(get_current_user)
):
    # Only the same patient can fetch their appointments
    if current_user.role != "patient" or current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="forbidden")
    appts = crud.get_patient_appointments(db, patient_id)
    return appts
