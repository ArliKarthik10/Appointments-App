# Appointment Project — Backend

FastAPI backend using SQLite for a simple doctor-patient appointment booking system.

Run (create venv and install requirements):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Seed the database with a few doctors (runs once):

```bash
python seed.py
```

APIs:
- `POST /users` — create user (role `doctor` or `patient`)
- `GET /doctors` — list doctors
- `GET /doctors/{doctor_id}/availability?date=YYYY-MM-DD` — get 4 slots (1..4) with availability
- `POST /appointments/book` — book a slot
- `DELETE /appointments/{appointment_id}` — cancel appointment
- `GET /patients/{patient_id}/appointments` — list patient appointments

Notes:
- Each doctor has 4 slots per day (1..4). Booking enforces uniqueness and avoids double-booking.
- Dates are validated to prevent booking in the past.
