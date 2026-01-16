## 🏥 Doctor Verification Flow - Complete Setup Guide

### **The Problem You Were Having**
When doctors registered and tried to login, they got `403 Forbidden` on `/doctors/me/appointments`. This happened because **doctors start with `is_verified = 0`** and unverified doctors cannot access their appointments.

### **How The System Works Now**

#### **Step 1: Doctor Registers**
- Doctor signs up with name, email, password, and **license number**
- Doctor is created in database with `is_verified = 0` (not verified yet)
- Database: `appointments.db` → doctors table

#### **Step 2: Admin Logs In**
- Admin email: `admin@hospital.com`
- Admin password: `admin123`
- Admin clicks "👨‍⚖️ Verify Doctors" button

#### **Step 3: Admin Sees Pending Doctors**
- AdminPanel shows all doctors with `is_verified = 0`
- Admin reviews:
  - Doctor name
  - Email
  - License number
  - Status (⏳ Pending)

#### **Step 4: Admin Verifies Doctor**
- Admin clicks "✅ Verify Doctor" button
- Doctor record updates: `is_verified = 1`
- Message: "Doctor verified successfully!"

#### **Step 5: Doctor Can Now Login and Work**
- Doctor logs in (now allowed because verified)
- Doctor can see their appointments
- Doctor can approve/reject appointments

---

### **Database Structure**

```
appointments.db (SQLite)
├── doctors
│   ├── id (primary key)
│   ├── name
│   ├── email (unique)
│   ├── hashed_password
│   ├── license_number (unique)
│   ├── is_verified (0 = pending, 1 = verified)
│   └── created_at
│
├── patients
│   ├── id (primary key)
│   ├── name
│   ├── email (unique)
│   ├── hashed_password
│   └── created_at
│
└── appointments
    ├── id (primary key)
    ├── doctor_id (foreign key)
    ├── patient_id (foreign key)
    ├── date
    ├── slot (1-4)
    ├── status (PENDING, BOOKED, CANCELLED)
    └── created_at
```

---

### **Testing The Flow**

**1. Create a Doctor**
```
Register → Select "Doctor" 
Fill: name, email, password, license number
```

**2. Login as Admin**
```
Login with:
Email: admin@hospital.com
Password: admin123
```

**3. Verify the Doctor**
```
Click "👨‍⚖️ Verify Doctors"
Find pending doctor
Click "✅ Verify Doctor"
See success message
```

**4. Doctor Can Now Work**
```
Login as doctor
Click "My Appointments"
See all appointments (empty initially)
Can approve/reject when patients book
```

**5. Patient Books Appointment**
```
Login as patient
Click "Book Appointment"
Select doctor
Select date and time slot
Doctor sees appointment as PENDING
Doctor can approve (BOOKED) or reject (CANCELLED)
```

---

### **Key Files Modified**

**Backend:**
- `app/main.py` - Added admin endpoints, verification checks
- `app/auth.py` - Fixed authentication to allow unverified doctors to login
- `app/crud.py` - Fixed CRUD functions (was broken)
- `app/schemas.py` - Added is_verified to Token response

**Frontend:**
- `components/AdminPanel.tsx` - NEW component for admin to verify doctors
- `src/App.tsx` - Added admin route and navigation
- `components/MyAppointments.tsx` - Fixed props to support all roles
- `src/api.ts` - Already had adminApi (no changes needed)

---

### **Error Messages & Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| `403 Forbidden` on appointments | Doctor not verified | Admin must verify doctor first |
| `No appointments found` | Doctor is new | Patients need to book appointments |
| `Failed to fetch pending doctors` | Not logged in as admin | Use admin credentials |
| `Doctor not found` | Invalid doctor ID | Refresh page or re-login |

---

### **Admin Credentials**
- **Email:** `admin@hospital.com`
- **Password:** `admin123`

These are hardcoded and used for testing. Change in production!

---

### **Next Steps**
1. ✅ Backend is working correctly
2. ✅ Admin panel is working
3. ✅ Doctor verification works
4. ✅ Appointments can be booked and managed
5. Patient flow is complete (already working)
