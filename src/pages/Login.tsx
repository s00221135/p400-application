// src/pages/Login.tsx
import React, { useState } from "react";
import { MDBContainer, MDBInput, MDBBtn } from "mdb-react-ui-kit";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { useNavigate } from "react-router-dom";
import UserPool from "../Cognito";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        console.log("Login success:", session);

        // Store ID token in local storage if you want to use a Cognito Authorizer
        const idToken = session.getIdToken().getJwtToken();
        localStorage.setItem("idToken", idToken);

        // Also, decode the payload to get the user's sub (unique ID)
        const payload = session.getIdToken().decodePayload();
        localStorage.setItem("userID", payload.sub);

        // Navigate to a protected page or home
        navigate("/home");
      },
      onFailure: (err) => {
        console.error("Login error:", err);
        alert("Login failed: " + err.message);
      },
      newPasswordRequired: (userAttributes) => {
        console.log("New password required:", userAttributes);
        // handle forced password change if needed
      },
    });
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
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <h3 style={{ fontWeight: "bold", marginBottom: "20px" }}>Welcome Back</h3>
        <form onSubmit={handleSubmit}>
          <MDBInput
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          <p className="text-center mt-4" style={{ fontSize: "0.9rem", color: "#555" }}>
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
