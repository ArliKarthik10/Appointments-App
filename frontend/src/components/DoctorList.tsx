import React, { useState, useEffect } from "react";
import { api } from "../api";

interface Doctor {
  id: number;
  name: string;
  email: string;
}

interface Props {
  onSelectDoctor: (id: number) => void;
}

export const DoctorList: React.FC<Props> = ({ onSelectDoctor }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const token = localStorage.getItem("token")!;
      const data = await api.getDoctors(token);
      setDoctors(data);
    } catch (err) {
      alert("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading doctors...</div>;

  return (
    <div className="doctor-list">
      <h2>Select a Doctor</h2>
      <div className="card-grid">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="card"
            onClick={() => onSelectDoctor(doctor.id)}
          >
            <div className="doctor-icon">👨‍⚕️</div>
            <h3>{doctor.name}</h3>
            <p>{doctor.email}</p>
            <button className="select-btn">View Availability</button>
          </div>
        ))}
      </div>
    </div>
  );
};
