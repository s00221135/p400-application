import React, { useState, useEffect } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
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

  // Retrieve email from navigation state
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      alert("No email provided for confirmation.");
      navigate("/register");
    }
  }, [email, navigate]);

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
        setMessage("Account confirmed successfully!");
        // Navigate to setup-space after a short delay
        setTimeout(() => {
          navigate("/setup-space");
        }, 2000);
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
            <MDBTypography tag="p" className="text-center" style={{ color: message.includes("successfully") ? "green" : "red" }}>
              {message}
            </MDBTypography>
          )}
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
};

export default Confirm;
