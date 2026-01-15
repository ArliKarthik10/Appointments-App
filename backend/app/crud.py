from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from . import models, schemas
from .auth import get_password_hash
import datetime


def email_exists(db: Session, email: str) -> bool:
    if db.query(models.Doctor).filter(models.Doctor.email == email).first():
        return True
    if db.query(models.Patient).filter(models.Patient.email == email).first():
        return True
    return False


def create_doctor(db: Session, doc_in: schemas.DoctorCreate):
    if email_exists(db, doc_in.email):
        raise ValueError("email already registered")
    hashed = get_password_hash(doc_in.password)
    doc = models.Doctor(name=doc_in.name, email=doc_in.email, hashed_password=hashed)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def create_patient(db: Session, pat_in: schemas.PatientCreate):
    if email_exists(db, pat_in.email):
        raise ValueError("email already registered")
    hashed = get_password_hash(pat_in.password)
    pat = models.Patient(name=pat_in.name, email=pat_in.email, hashed_password=hashed)
    db.add(pat)
    db.commit()
    db.refresh(pat)
    return pat


def get_doctor(db: Session, doctor_id: int):
    return db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()


def get_patient(db: Session, patient_id: int):
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()


def list_doctors(db: Session):
    return db.query(models.Doctor).all()


def get_appointments_for_doctor_date(db: Session, doctor_id: int, date: datetime.date):
    return (
        db.query(models.Appointment)
        .filter(models.Appointment.doctor_id == doctor_id, models.Appointment.date == date)
        .all()
    )


def create_appointment(db: Session, appt_in: schemas.AppointmentCreate):
    # Validate existence
    doctor = get_doctor(db, appt_in.doctor_id)
    patient = get_patient(db, appt_in.patient_id)
    if not doctor:
        raise ValueError("doctor_id is invalid")
    if not patient:
        raise ValueError("patient_id is invalid")

    # Prevent booking in the past (also enforced by schema)
    if appt_in.date < datetime.date.today():
        raise ValueError("cannot book past dates")

    appt = models.Appointment(
        doctor_id=appt_in.doctor_id,
        patient_id=appt_in.patient_id,
        date=appt_in.date,
        slot=appt_in.slot,
    )
    db.add(appt)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Could be doctor's slot already taken or patient double-booking
        raise
    db.refresh(appt)
    return appt


def cancel_appointment(db: Session, appointment_id: int):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        return None
    db.delete(appt)
    db.commit()
    return appt


def get_patient_appointments(db: Session, patient_id: int):
    return db.query(models.Appointment).filter(models.Appointment.patient_id == patient_id).all()
