import React, { useState, useEffect } from "react";
import { adminApi } from "../api";

interface Doctor {
  id: number;
  name: string;
  email: string;
  license_number: string;
  is_verified: number;
}

export const AdminPanel: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const pendingData = await adminApi.getPendingDoctors(token);
      setDoctors(pendingData);
      
      const allData = await adminApi.getAllDoctors(token);
      setAllDoctors(allData);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doctorId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setMessage("");
      await adminApi.verifyDoctor(token, doctorId);
      setMessage("Doctor verified successfully!");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to verify doctor");
    }
  };

  const handleReject = async (doctorId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setMessage("");
      await adminApi.rejectDoctor(token, doctorId);
      setMessage("Doctor rejected successfully!");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to reject doctor");
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <span style={{ color: "green", fontWeight: "bold" }}>✅ Approved</span>;
    } else if (status === 2) {
      return <span style={{ color: "red", fontWeight: "bold" }}>❌ Rejected</span>;
    }
    return <span style={{ color: "orange", fontWeight: "bold" }}>⏳ Pending</span>;
  };

  if (loading) return <div>Loading doctors...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>👨‍⚕️ Admin Panel</h2>

      {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", backgroundColor: "#ffe0e0", borderRadius: "4px" }}>{error}</div>}
      {message && <div style={{ color: "green", marginBottom: "10px", padding: "10px", backgroundColor: "#e0ffe0", borderRadius: "4px" }}>{message}</div>}

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: activeTab === "pending" ? "#2196F3" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Pending Doctors
        </button>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "all" ? "#2196F3" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          All Doctors
        </button>
      </div>

      {activeTab === "pending" && (
        <div>
          <h3>⏳ Pending Doctors Verification</h3>
          {doctors.length === 0 ? (
            <p>No pending doctors to verify</p>
          ) : (
            <div>
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: "15px",
                    margin: "10px 0",
                    borderRadius: "5px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <p>
                    <strong>Name:</strong> {doctor.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {doctor.email}
                  </p>
                  <p>
                    <strong>License Number:</strong> {doctor.license_number}
                  </p>
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button
                      onClick={() => handleVerify(doctor.id)}
                      style={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        padding: "8px 15px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(doctor.id)}
                      style={{
                        backgroundColor: "#f44336",
                        color: "white",
                        padding: "8px 15px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "all" && (
        <div>
          <h3>📋 All Doctors List</h3>
          {allDoctors.length === 0 ? (
            <p>No doctors found</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "10px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#2196F3",
                      color: "white",
                    }}
                  >
                    <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>
                      ID
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>
                      Name
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>
                      Email
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>
                      License Number
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allDoctors.map((doctor) => (
                    <tr
                      key={doctor.id}
                      style={{ backgroundColor: doctor.is_verified === 0 ? "#fff3cd" : "#f9f9f9" }}
                    >
                      <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                        {doctor.id}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                        {doctor.name}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                        {doctor.email}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                        {doctor.license_number}
                      </td>
                      <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                        {getStatusBadge(doctor.is_verified)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <button
        onClick={loadData}
        style={{
          marginTop: "15px",
          padding: "8px 15px",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        🔄 Refresh
      </button>
    </div>
  );
};
