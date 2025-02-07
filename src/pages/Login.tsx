import React, { useState, useEffect } from "react";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBBtn,
  MDBSpinner,
} from "mdb-react-ui-kit";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { useNavigate } from "react-router-dom";
import UserPool from "../Cognito";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const tokensString = sessionStorage.getItem("authTokens");
    const tokens = tokensString ? JSON.parse(tokensString) : null;
    if (tokens?.accessToken) {
      navigate("/home");
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

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

        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();
        const userID = session.getIdToken().decodePayload().sub;
        const username = session.getIdToken().decodePayload().email;

        const authTokens = {
          idToken,
          accessToken,
          refreshToken,
          userID,
          username,
        };

        // Store tokens in sessionStorage
        sessionStorage.setItem("authTokens", JSON.stringify(authTokens));
        console.log("Stored authTokens in sessionStorage:", authTokens);

        setLoading(false);
        navigate("/home");
      },
      onFailure: (err) => {
        console.error("Login error:", err);
        alert("Login failed: " + err.message);
        setLoading(false);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        console.log("New password required:", userAttributes, requiredAttributes);
        alert("A new password is required. Please reset your password.");
        setLoading(false);
      },
    });
  };

  return (
    <MDBContainer
      fluid
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ece9e6, #ffffff)",
      }}
    >
      <MDBCard style={{ maxWidth: "400px", width: "100%", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
        <MDBCardBody className="p-4">
          <div className="text-center mb-4">
            <h1 style={{ fontWeight: "bold" }}>Flatchat</h1>
            <h4 style={{ fontWeight: "bold", marginBottom: "20px" }}>Welcome Back</h4>
          </div>
          <form onSubmit={handleSubmit}>
            <MDBInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3"
              required
            />
            <MDBInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
              required
            />
            <MDBBtn
              type="submit"
              color="primary"
              className="w-100"
              style={{ padding: "10px", fontSize: "1rem" }}
              disabled={loading}
            >
              {loading ? <MDBSpinner size="sm" /> : "Log In"}
            </MDBBtn>
            <p className="text-center mt-4" style={{ fontSize: "0.9rem", color: "#555" }}>
              Don’t have an account?{" "}
              <a href="/register" style={{ color: "#007bff", textDecoration: "none" }}>
                Register
              </a>
            </p>
          </form>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
};

export default Login;
