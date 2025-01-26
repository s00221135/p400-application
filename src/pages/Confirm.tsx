// src/pages/Confirm.tsx
import React, { useState, useEffect } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "../Cognito";
import { useLocation, useNavigate } from "react-router-dom";

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

    // Ensure email is present
    if (!email) {
      setMessage("Email is missing. Please register again.");
      return;
    }

    // Create a CognitoUser object with the user’s email (username).
    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    // Attempt to confirm registration with the code
    user.confirmRegistration(code, true, (err, result) => {
      if (err) {
        setMessage("Error confirming account: " + err.message);
        console.error("Confirm error:", err);
      } else {
        console.log("Confirmation success:", result);
        setMessage("Account confirmed successfully! Redirecting to home...");

        // Optionally, navigate to home after a short delay
        setTimeout(() => {
          navigate("/home");
        }, 2000); // 2-second delay
      }
    });
  };

  return (
    <div style={{ margin: "50px auto", maxWidth: "400px", textAlign: "center" }}>
      <h2>Confirm Your Account</h2>
      <p>Enter the confirmation code sent to your email.</p>
      {/* Display the email for user reference */}
      <p>
        <strong>Email:</strong> {email}
      </p>
      <form onSubmit={handleConfirm}>
        <div style={{ marginBottom: "20px" }}>
          <label>Confirmation Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            required
          />
        </div>
        <button
          type="submit"
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Confirm
        </button>
      </form>
      {message && (
        <p
          style={{
            marginTop: "20px",
            color: message.includes("successfully") ? "green" : "red",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Confirm;
