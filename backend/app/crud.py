from passlib.context import CryptContext
from sqlalchemy.orm import Session
from . import models, schemas

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_doctor(db: Session, doc_in: schemas.DoctorCreate):
    """Create a new doctor"""
    # Check if email already exists
    existing_email = db.query(models.Doctor).filter(models.Doctor.email == doc_in.email).first()
    if existing_email:
        raise ValueError("Email already registered")
    
    # Check if license already exists
    existing_license = db.query(models.Doctor).filter(models.Doctor.license_number == doc_in.license_number).first()
    if existing_license:
        raise ValueError("License number already registered")
    
    db_doctor = models.Doctor(
        name=doc_in.name,
        email=doc_in.email,
        hashed_password=get_password_hash(doc_in.password),
        license_number=doc_in.license_number,
        is_verified=0
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


def create_patient(db: Session, pat_in: schemas.PatientCreate):
    """Create a new patient"""
    # Check if email already exists
    existing = db.query(models.Patient).filter(models.Patient.email == pat_in.email).first()
    if existing:
        raise ValueError("Email already registered")
    
    db_patient = models.Patient(
        name=pat_in.name,
        email=pat_in.email,
        hashed_password=get_password_hash(pat_in.password),
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def get_doctor(db: Session, doctor_id: int):
    """Get doctor by ID"""
    return db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()


def list_doctors(db: Session):
    """List all doctors"""
    return db.query(models.Doctor).filter(models.Doctor.is_verified == 1).all()


def get_appointments_for_doctor_date(db: Session, doctor_id: int, date):
    """Get appointments for a doctor on a specific date"""
    return db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id,
        models.Appointment.date == date
    ).all()


def create_appointment(db: Session, appt_in: schemas.AppointmentCreate):
    """Create a new appointment"""
    # Check if slot is already booked
    existing = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == appt_in.doctor_id,
        models.Appointment.date == appt_in.date,
        models.Appointment.slot == appt_in.slot
    ).first()
    if existing:
        raise ValueError("Slot already booked")
    
    # Check if patient already has appointment at this slot
    patient_existing = db.query(models.Appointment).filter(
        models.Appointment.patient_id == appt_in.patient_id,
        models.Appointment.date == appt_in.date,
        models.Appointment.slot == appt_in.slot
    ).first()
    if patient_existing:
        raise ValueError("Patient already has appointment at this slot")
    
    db_appointment = models.Appointment(
        doctor_id=appt_in.doctor_id,
        patient_id=appt_in.patient_id,
        date=appt_in.date,
        slot=appt_in.slot,
        status="PENDING"
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def cancel_appointment(db: Session, appointment_id: int):
    """Cancel an appointment"""
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise ValueError("Appointment not found")
    
    appt.status = "CANCELLED"
    db.commit()
    db.refresh(appt)
    return appt


def get_patient_appointments(db: Session, patient_id: int):
    """Get all appointments for a patient"""
    return db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient_id
    ).all()


def reject_appointment(db: Session, appointment_id: int):
    """Reject an appointment"""
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise ValueError("Appointment not found")
    
    appt.status = "REJECTED"
    db.commit()
    db.refresh(appt)
    return appt


def reschedule_appointment(db: Session, appointment_id: int, new_date, new_slot: int):
    """Reschedule an appointment - changes to new date/slot and status to PENDING"""
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise ValueError("Appointment not found")
    
    # Check if new slot is already booked
    existing = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == appt.doctor_id,
        models.Appointment.date == new_date,
        models.Appointment.slot == new_slot,
        models.Appointment.id != appointment_id
    ).first()
    if existing:
        raise ValueError("New slot already booked")
    
    appt.date = new_date
    appt.slot = new_slot
    appt.status = "PENDING"
    appt.is_rescheduled = 1
    db.commit()
    db.refresh(appt)
    return appt


def get_all_doctors_with_status(db: Session):
    """Get all doctors with their verification status"""
    return db.query(models.Doctor).all()
