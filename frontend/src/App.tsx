// src/App.tsx
import React, { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { DoctorList } from "./components/DoctorList";
import { DoctorAvailability } from "./components/DoctorAvailability";
import { MyAppointments } from "./components/MyAppointments";
import { AdminPanel } from "./components/AdminPanel";
import { api } from "./api";
import "./App.css";

export interface User {
  email: string;
  role: "doctor" | "patient" | "admin";
  id: number;
}

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<
    "login" | "register" | "doctors" | "appointments" | "admin"
  >("login");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    try {
      // atob decodes a base64 encoded string
      const decoded = JSON.parse(atob(token.split(".")[1])); 

      setUser({
        email: decoded.sub,
        role: decoded.role,
        id: decoded.id ?? 0, // ?? default to 0 if id is undefined
      });

      if (decoded.role === "admin") {
        setView("admin");
      } else if (decoded.role === "patient") {
        setView("doctors");
      } else {
        setView("appointments");
      }
    } catch (err) {
      console.error("Invalid token", err);
      localStorage.removeItem("token");
      setToken(null);
    }
  }, [token]); // [token] dependency ensures this runs when token changes

  // [] runs only once on mount if [] was also not given it renders again and again on every state change

  const handleLogin = (accessToken: string) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setView("login");
    setSelectedDoctor(null);
  };

  if (!token) {
    return (
      <div className="app">
        <div className="auth-container">
          <h1>🏥 Hospital Appointment System</h1>
          {view === "login" ? (
            <>
              <Login onLogin={handleLogin} />
              <p className="switch-auth">
                Don't have an account?{" "}
                <button onClick={() => setView("register")}>Register</button>
              </p>
            </>
          ) : (
            <>
              <Register onRegister={() => setView("login")} />
              <p className="switch-auth">
                Already have an account?{" "}
                <button onClick={() => setView("login")}>Login</button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🏥 Hospital Appointment System</h1>
        <div className="user-info">
          <span>
            {user?.email} ({user?.role})
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <nav className="nav">
        {user?.role === "patient" && (
          <>
            <button
              className={view === "doctors" ? "active" : ""}
              onClick={() => {
                setView("doctors");
                setSelectedDoctor(null);
              }}
            >
              Book Appointment
            </button>
            <button
              className={view === "appointments" ? "active" : ""}
              onClick={() => setView("appointments")}
            >
              My Appointments
            </button>
          </>
        )}
        {user?.role === "doctor" && (
          <button
            className={view === "appointments" ? "active" : ""}
            onClick={() => setView("appointments")}
          >
            My Appointments
          </button>
        )}
        {user?.role === "admin" && (
          <button
            className={view === "admin" ? "active" : ""}
            onClick={() => setView("admin")}
          >
            👨‍⚖️ Verify Doctors
          </button>
        )}
      </nav>

      <main className="main">
        {user?.role === "admin" && view === "admin" && <AdminPanel />}

        {user?.role === "patient" && view === "doctors" && !selectedDoctor && (
          <DoctorList onSelectDoctor={setSelectedDoctor} />
        )}

        {user?.role === "patient" && view === "doctors" && selectedDoctor && (
          <DoctorAvailability
            doctorId={selectedDoctor}
            patientId={user.id}
            onBack={() => setSelectedDoctor(null)}
          />
        )}

        {view === "appointments" && user && (
          <MyAppointments userId={user.id} userRole={user.role} />
        )}
      </main>
    </div>
  );
}

export default App;
