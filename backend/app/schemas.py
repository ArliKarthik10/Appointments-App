from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional
import datetime


class DoctorCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    license_number: str


class PatientCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class DoctorOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    license_number: str
    is_verified: int

    class Config:
        orm_mode = True


class PatientOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        orm_mode = True


class AppointmentCreate(BaseModel):
    doctor_id: int
    patient_id: int
    date: datetime.date
    slot: int = Field(..., ge=1, le=4)

    @validator("date")
    def no_past_dates(cls, v):
        if v < datetime.date.today():
            raise ValueError("date cannot be in the past")
        return v


class AppointmentOut(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    date: datetime.date
    slot: int
    status: str = "PENDING"
    is_rescheduled: int = 0

    class Config:
        orm_mode = True


class SlotStatus(BaseModel):
    slot: int
    available: bool
    appointment_id: Optional[int] = None
    patient_id: Optional[int] = None

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None
    is_verified: Optional[int] = None


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
