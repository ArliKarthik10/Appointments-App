import React, { useState } from "react";
import { api } from "../api";

interface Props {
  onRegister: () => void;
}

export const Register: React.FC<Props> = ({ onRegister }) => {
  const [role, setRole] = useState<"doctor" | "patient">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.register(
        role,
        name,
        email,
        password,
        role === "doctor" ? licenseNumber : undefined
      );

      alert("Registration successful! Please login.");
      onRegister();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Register</h2>
      {error && <div className="error">{error}</div>}
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as any)}
        required
      >
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>
      <div className="fullname-input-container">
        <label htmlFor="name">Full Name:</label>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="email-input-container">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="password-input-container">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      {role === "doctor" && (
        <div className="license-input-container">
          <label htmlFor="license">License Number:</label>
          <input
            type="text"
            placeholder="Medical License Number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
          />
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
};
