import React, { useState, useEffect } from "react";
import { api } from "../api";

interface Appointment {
  id: number;
  doctor_id?: number;
  patient_id?: number;
  date: string;
  slot: number;
  status: "PENDING" | "BOOKED" | "CANCELLED" | "REJECTED";
}

interface Props {
  userId: number;
  userRole: "doctor" | "patient" | "admin";
}

export const MyAppointments: React.FC<Props> = ({ userId, userRole }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState(1);

  const SLOT_TIMES = [
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM",
    "2:00 PM - 4:00 PM",
    "4:00 PM - 6:00 PM",
  ];

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    try {
      const data =
        userRole === "patient"
          ? await api.getMyPatientAppointments(token)
          : await api.getMyDoctorAppointments(token);
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appointmentId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionLoading(appointmentId);
    try {
      await api.approveAppointment(token, appointmentId);
      setMessage("Appointment approved!");
      loadAppointments();
    } catch (err: any) {
      setError(err.message || "Failed to approve appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appointmentId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionLoading(appointmentId);
    try {
      await api.rejectAppointment(token, appointmentId);
      setMessage("Appointment rejected!");
      loadAppointments();
    } catch (err: any) {
      setError(err.message || "Failed to reject appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (appointmentId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!newDate) {
      setError("Please select a new date");
      return;
    }

    setActionLoading(appointmentId);
    try {
      await api.rescheduleAppointment(token, appointmentId, newDate, newSlot);
      setMessage("Appointment rescheduled! Doctor will need to accept again.");
      setRescheduleId(null);
      setNewDate("");
      setNewSlot(1);
      loadAppointments();
    } catch (err: any) {
      setError(err.message || "Failed to reschedule appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    setActionLoading(appointmentId);
    try {
      await api.patientCancelAppointment(token, appointmentId);
      setMessage("Appointment cancelled!");
      loadAppointments();
    } catch (err: any) {
      setError(err.message || "Failed to cancel appointment");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#ff9800";
      case "BOOKED":
        return "#4CAF50";
      case "CANCELLED":
        return "#f44336";
      case "REJECTED":
        return "#ff5722";
      default:
        return "#666";
    }
  };

  if (loading) return <div>Loading appointments...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{userRole === "doctor" ? "👨‍⚕️ My Appointments" : "📋 My Appointments"}</h2>

      {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", backgroundColor: "#ffe0e0", borderRadius: "4px" }}>{error}</div>}
      {message && <div style={{ color: "green", marginBottom: "10px", padding: "10px", backgroundColor: "#e0ffe0", borderRadius: "4px" }}>{message}</div>}

      {appointments.length === 0 ? (
        <p>No appointments found</p>
      ) : (
        appointments.map((appt) => (
          <div
            key={appt.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              margin: "10px 0",
              backgroundColor: "#f9f9f9",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              <p style={{ margin: "5px 0" }}>
                <strong>📅 Date:</strong> {appt.date}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>⏰ Time:</strong> {SLOT_TIMES[appt.slot - 1]}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    backgroundColor: getStatusColor(appt.status),
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  {appt.status === "PENDING" && "⏳"}
                  {appt.status === "BOOKED" && "✅"}
                  {appt.status === "CANCELLED" && "❌"}
                  {appt.status === "REJECTED" && "❌"}
                  {" " + appt.status}
                </span>
              </p>
            </div>

            {userRole === "doctor" && appt.status === "PENDING" && (
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  onClick={() => handleApprove(appt.id)}
                  disabled={actionLoading === appt.id}
                  style={{
                    backgroundColor: "#4CAF50",
                    color: "white",
                    padding: "8px 15px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: actionLoading === appt.id ? "not-allowed" : "pointer",
                    opacity: actionLoading === appt.id ? 0.6 : 1,
                  }}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleReject(appt.id)}
                  disabled={actionLoading === appt.id}
                  style={{
                    backgroundColor: "#f44336",
                    color: "white",
                    padding: "8px 15px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: actionLoading === appt.id ? "not-allowed" : "pointer",
                    opacity: actionLoading === appt.id ? 0.6 : 1,
                  }}
                >
                  ❌ Reject
                </button>
              </div>
            )}

            {userRole === "doctor" && appt.status === "BOOKED" && (
              <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
                <p style={{ margin: "0", color: "#1976d2" }}>✅ <strong>Confirmed - Waiting for appointment</strong></p>
              </div>
            )}

            {userRole === "doctor" && appt.status === "CANCELLED" && (
              <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#ffebee", borderRadius: "4px" }}>
                <p style={{ margin: "0", color: "#c62828" }}>❌ <strong>Patient cancelled this appointment</strong></p>
              </div>
            )}

            {userRole === "patient" && appt.status === "BOOKED" && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <button
                    onClick={() => setRescheduleId(rescheduleId === appt.id ? null : appt.id)}
                    disabled={actionLoading === appt.id}
                    style={{
                      backgroundColor: "#2196F3",
                      color: "white",
                      padding: "8px 15px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: actionLoading === appt.id ? "not-allowed" : "pointer",
                      opacity: actionLoading === appt.id ? 0.6 : 1,
                    }}
                  >
                    📅 Reschedule
                  </button>
                  <button
                    onClick={() => handleCancel(appt.id)}
                    disabled={actionLoading === appt.id}
                    style={{
                      backgroundColor: "#f44336",
                      color: "white",
                      padding: "8px 15px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: actionLoading === appt.id ? "not-allowed" : "pointer",
                      opacity: actionLoading === appt.id ? 0.6 : 1,
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>

                {rescheduleId === appt.id && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      backgroundColor: "#fff3cd",
                      borderRadius: "4px",
                      border: "1px solid #ffc107",
                    }}
                  >
                    <p style={{ margin: "0 0 10px 0" }}>
                      <strong>📅 Select New Date and Time:</strong>
                    </p>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      style={{
                        padding: "8px",
                        marginRight: "10px",
                        marginBottom: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                    <select
                      value={newSlot}
                      onChange={(e) => setNewSlot(parseInt(e.target.value))}
                      style={{
                        padding: "8px",
                        marginRight: "10px",
                        marginBottom: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    >
                      {SLOT_TIMES.map((time, idx) => (
                        <option key={idx} value={idx + 1}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleReschedule(appt.id)}
                      disabled={actionLoading === appt.id}
                      style={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        padding: "8px 15px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: actionLoading === appt.id ? "not-allowed" : "pointer",
                        marginBottom: "10px",
                        opacity: actionLoading === appt.id ? 0.6 : 1,
                      }}
                    >
                      ✅ Confirm Reschedule
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
