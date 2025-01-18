import React, { useState } from "react";
import { MDBContainer, MDBInput, MDBBtn } from "mdb-react-ui-kit";
import logoImage from "../assets/logo.png";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Logging in with:", { username, password });
    // Simulate navigation
    window.location.href = "/home";
  };

  return (
    <MDBContainer
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        width: "100vw",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#e0e0e0",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "90%",
          width: "100%",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <img
          src={logoImage}
          alt="Logo"
          style={{
            width: "70px",
            height: "70px",
            marginBottom: "20px",
          }}
        />
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontWeight: "bold", marginBottom: "20px" }}>Welcome Back</h3>
          <MDBInput
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-3"
            style={{ padding: "10px", fontSize: "1rem" }}
          />
          <MDBInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
            style={{ padding: "10px", fontSize: "1rem" }}
          />
          <MDBBtn
            color="primary"
            type="submit"
            className="w-100"
            style={{ padding: "10px", fontSize: "1rem" }}
          >
            Log In
          </MDBBtn>
          <p
            className="text-center mt-4"
            style={{ fontSize: "0.9rem", color: "#555" }}
          >
            Don’t have an account?{" "}
            <a href="/register" style={{ color: "#007bff" }}>
              Register
            </a>
          </p>
        </form>
      </div>
    </MDBContainer>
  );
};

export default Login;
