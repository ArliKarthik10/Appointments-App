import React, { useState, useEffect } from "react";
import { api } from "../api";

interface Slot {
  slot: number;
  available: boolean;
  appointment_id: number | null;
  patient_id: number | null;
}

interface Props {
  doctorId: number;
  patientId: number;
  onBack: () => void;
}

const SLOT_TIMES = [
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
];

export const DoctorAvailability: React.FC<Props> = ({
  doctorId,
  patientId,
  onBack,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [date]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token")!;
      const data = await api.getDoctorAvailability(token, doctorId, date);
      setSlots(data.slots);
    } catch (err) {
      alert("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (slot: number) => {
    if (!confirm(`Book slot ${slot} on ${date}?`)) return;

    try {
      const token = localStorage.getItem("token")!;
      await api.bookAppointment(token, {
        doctor_id: doctorId,
        patient_id: patientId,
        date,
        slot,
      });
      alert("Appointment booked successfully!");
      loadAvailability();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="availability">
      <button onClick={onBack} className="back-btn">
        ← Back to Doctors
      </button>
      <h2>Book Appointment</h2>
      <div className="date-picker">
        <label>Select Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={minDate}
        />
      </div>

      {loading ? (
        <div className="loading">Loading slots...</div>
      ) : (
        <div className="slots-grid">
          {slots.map((slot) => (
            <div
              key={slot.slot}
              className={`slot-card ${slot.available ? "available" : "booked"}`}
            >
              <div className="slot-time">
                <strong>Slot {slot.slot}</strong>
                <span>{SLOT_TIMES[slot.slot - 1]}</span>
              </div>
              {slot.available ? (
                <button
                  onClick={() => handleBook(slot.slot)}
                  className="book-btn"
                >
                  Book Now
                </button>
              ) : (
                <span className="booked-label">Booked</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
