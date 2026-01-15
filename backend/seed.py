from app import database, models, crud, schemas
from sqlalchemy.orm import Session


def seed():
    db: Session = next(database.get_db())
    # create tables
    models.Base.metadata.create_all(bind=database.engine)

    # add some doctors
    doctors = [("Dr. Alice", "alice@example.com", "pass123"), ("Dr. Bob", "bob@example.com", "pass123"), ("Dr. Carol", "carol@example.com", "pass123")]
    for name, email, pwd in doctors:
        u = schemas.DoctorCreate(name=name, email=email, password=pwd)
        try:
            crud.create_doctor(db, u)
        except ValueError:
            pass

    # add a sample patient
    p = schemas.PatientCreate(name="John Patient", email="john@example.com", password="patientpass")
    try:
        crud.create_patient(db, p)
    except ValueError:
        pass

    print("Seeded doctors and one patient.")


if __name__ == "__main__":
    seed()
