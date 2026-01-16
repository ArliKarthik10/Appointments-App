// src/api.ts
const API_BASE = "http://localhost:8080";

export const api = {
  // Login returns JWT token
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: email,
        password,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }

    return res.json(); // { access_token, token_type, role }
  },

  // Register doctor or patient
  register: async (
    role: "doctor" | "patient",
    name: string,
    email: string,
    password: string,
    licenseNumber?: string
  ) => {
    const endpoint = role === "doctor" ? "/doctors/register" : "/patients";
    const payload =
      role === "doctor"
        ? { name, email, password, license_number: licenseNumber }
        : { name, email, password };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Registration failed");
    }
    return res.json();
  },

  // Get all doctors (optional)
  getDoctors: async (token: string) => {
    const res = await fetch(`${API_BASE}/doctors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch doctors");
    return res.json();
  },

  // Get doctor availability
  getDoctorAvailability: async (
    token: string,
    doctorId: number,
    date: string
  ) => {
    const res = await fetch(
      `${API_BASE}/doctors/${doctorId}/availability?date=${date}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Failed to fetch availability");
    return res.json();
  },

  // Book appointment
  bookAppointment: async (token: string, data: any) => {
    const res = await fetch(`${API_BASE}/appointments/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Booking failed");
    }
    return res.json();
  },

  // Get appointments for patient
  getMyPatientAppointments: async (token: string) => {
    const res = await fetch(`${API_BASE}/patients/me/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch patient appointments");
    return res.json();
  },

  // Get appointments for doctor
  getMyDoctorAppointments: async (token: string) => {
    const res = await fetch(`${API_BASE}/doctors/me/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch doctor appointments");
    return res.json();
  },

  // Cancel appointment
  cancelAppointment: async (token: string, appointmentId: number) => {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Cancellation failed");
    }
    return res.json();
  },

  // Approve appointment (doctor)
  approveAppointment: async (token: string, appointmentId: number) => {
    const res = await fetch(
      `${API_BASE}/appointments/${appointmentId}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error("Failed to approve appointment");
    return res.json();
  },

  // Reject appointment (doctor)
  rejectAppointment: async (token: string, appointmentId: number) => {
    const res = await fetch(
      `${API_BASE}/appointments/${appointmentId}/reject`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error("Failed to reject appointment");
    return res.json();
  },

  // Reschedule appointment (patient)
  rescheduleAppointment: async (
    token: string,
    appointmentId: number,
    newDate: string,
    newSlot: number
  ) => {
    const res = await fetch(
      `${API_BASE}/appointments/${appointmentId}/reschedule?new_date=${newDate}&new_slot=${newSlot}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to reschedule");
    }
    return res.json();
  },

  // Cancel appointment (patient)
  patientCancelAppointment: async (token: string, appointmentId: number) => {
    const res = await fetch(
      `${API_BASE}/appointments/${appointmentId}/patient-cancel`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to cancel");
    }
    return res.json();
  },
};

// Admin APIs
export const adminApi = {
  // Get pending doctors
  getPendingDoctors: async (token: string) => {
    const res = await fetch(`${API_BASE}/admin/pending-doctors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch pending doctors");
    return res.json();
  },

  // Verify doctor
  verifyDoctor: async (token: string, doctorId: number) => {
    const res = await fetch(`${API_BASE}/admin/verify-doctor/${doctorId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to verify doctor");
    return res.json();
  },

  // Reject doctor
  rejectDoctor: async (token: string, doctorId: number) => {
    const res = await fetch(`${API_BASE}/admin/reject-doctor/${doctorId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to reject doctor");
    return res.json();
  },

  // Get all doctors with status
  getAllDoctors: async (token: string) => {
    const res = await fetch(`${API_BASE}/admin/all-doctors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch doctors");
    return res.json();
  },
};
