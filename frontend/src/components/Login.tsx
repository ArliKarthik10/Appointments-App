import React, { useState } from "react";
import { api } from "../api";
import "../App.css";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

   try {
     const data = await api.login(email, password);
     localStorage.setItem("token", data.access_token);
     localStorage.setItem("role", data.role);
     
     // 👇 Check if doctor is verified
     if (data.role === "doctor" && data.is_verified === 0) {
       setError("Your account is not verified by admin yet. Please wait.");
       localStorage.removeItem("token");
       localStorage.removeItem("role");
       setLoading(false);
       return;
     }
     
     alert(`Logged in as ${data.role}`);
     window.location.reload();
   } catch (err: any) {
     setError(err.message || "Invalid email or password");
     setLoading(false);
   }

  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <div className="email-input-container">
        <label>Email:</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="password-input-container">
        <label>Password:</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};
