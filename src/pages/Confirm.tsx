import React, { useState, useEffect } from "react";
import { CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";
import UserPool from "../Cognito";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBInput,
  MDBBtn,
  MDBTypography
} from "mdb-react-ui-kit";

const Confirm: React.FC = () => {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Log the state to debug what we received
  console.log("Confirm page location state:", location.state);
  // Retrieve email and password from navigation state
  const { email, password } = (location.state as { email: string; password: string }) || {};

  useEffect(() => {
    if (!email || !password) {
      alert("Missing email or password for automatic sign-in. Please register again.");
      navigate("/register");
    }
  }, [email, password, navigate]);

  const handleConfirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      setMessage("Email is missing. Please register again.");
      return;
    }

    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    user.confirmRegistration(code, true, (err, result) => {
      if (err) {
        setMessage("Error confirming account: " + err.message);
        console.error("Confirm error:", err);
      } else {
        setMessage("Account confirmed successfully! Signing you in...");
        // Automatically sign in the user using the password passed from registration
        const authDetails = new AuthenticationDetails({
          Username: email,
          Password: password,
        });
        user.authenticateUser(authDetails, {
          onSuccess: (session) => {
            console.log("Automatic sign-in success:", session);
            const idToken = session.getIdToken().getJwtToken();
            const accessToken = session.getAccessToken().getJwtToken();
            const refreshToken = session.getRefreshToken().getToken();
            const userID = session.getIdToken().decodePayload().sub;
            const username = session.getIdToken().decodePayload().email;
            const authTokens = { idToken, accessToken, refreshToken, userID, username };

            // Store tokens in sessionStorage
            sessionStorage.setItem("authTokens", JSON.stringify(authTokens));
            console.log("Stored authTokens in sessionStorage:", authTokens);

            // After a short delay, navigate to SetupSpace
            setTimeout(() => {
              navigate("/setup-space");
            }, 2000);
          },
          onFailure: (authErr) => {
            setMessage("Automatic sign-in failed: " + authErr.message);
            console.error("Automatic sign-in error:", authErr);
          },
        });
      }
    });
  };

  return (
    <MDBContainer className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <MDBCard style={{ maxWidth: "400px", width: "100%" }} className="shadow">
        <MDBCardBody className="p-4">
          <MDBCardTitle className="text-center mb-4">Confirm Your Account</MDBCardTitle>
          <p className="text-center">Enter the confirmation code sent to your email.</p>
          <p className="text-center">
            <strong>Email:</strong> {email}
          </p>
          <form onSubmit={handleConfirm}>
            <MDBInput
              label="Confirmation Code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="mb-3"
            />
            <MDBBtn type="submit" color="primary" className="w-100 mb-3">
              Confirm
            </MDBBtn>
          </form>
          {message && (
            <MDBTypography
              tag="p"
              className="text-center"
              style={{ color: message.includes("successfully") ? "green" : "red" }}
            >
              {message}
            </MDBTypography>
          )}
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
};

export default Confirm;
