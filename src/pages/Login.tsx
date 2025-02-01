import React, { useState, useEffect } from "react";
import { MDBContainer, MDBInput, MDBBtn, MDBSpinner } from "mdb-react-ui-kit";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { useNavigate } from "react-router-dom";
import UserPool from "../Cognito";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const tokensString = localStorage.getItem("authTokens");
    const tokens = tokensString ? JSON.parse(tokensString) : null;
    const accessToken = tokens?.accessToken;
    if (accessToken) {
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
        localStorage.setItem("authTokens", JSON.stringify(authTokens));
        console.log("Stored authTokens:", authTokens);
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
      className="d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", width: "100vw", padding: "20px" }}
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
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3"
            style={{ padding: "10px", fontSize: "1rem" }}
            required
          />
          <MDBInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
            style={{ padding: "10px", fontSize: "1rem" }}
            required
          />
          <MDBBtn
            color="primary"
            type="submit"
            className="w-100"
            style={{ padding: "10px", fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? <MDBSpinner size="sm" /> : "Log In"}
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
