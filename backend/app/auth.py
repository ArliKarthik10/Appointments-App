from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import database, models
from types import SimpleNamespace

# dev SECRET_KEY (replace in production)
SECRET_KEY = "change_this_dev_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, email: str, password: str):
    # Try doctor
    doctor = db.query(models.Doctor).filter(models.Doctor.email == email).first()
    if doctor and verify_password(password, doctor.hashed_password):
        return SimpleNamespace(id=doctor.id, role="doctor", email=doctor.email)
    patient = db.query(models.Patient).filter(models.Patient.email == email).first()
    if patient and verify_password(password, patient.hashed_password):
        return SimpleNamespace(id=patient.id, role="patient", email=patient.email)
    return None


def get_db():
    yield from database.get_db()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    # load the user record so we have the id and can validate existence
    if role == "doctor":
        record = db.query(models.Doctor).filter(models.Doctor.email == username).first()
        if not record:
            raise credentials_exception
        return SimpleNamespace(id=record.id, role="doctor", email=record.email)
    else:
        record = db.query(models.Patient).filter(models.Patient.email == username).first()
        if not record:
            raise credentials_exception
        return SimpleNamespace(id=record.id, role="patient", email=record.email)
