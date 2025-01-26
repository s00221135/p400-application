import React, { useState } from "react";
import { MDBContainer, MDBInput, MDBBtn } from "mdb-react-ui-kit";
import { CognitoUserAttribute } from "amazon-cognito-identity-js";
import { useNavigate } from "react-router-dom";
import UserPool from "../Cognito";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      alert("All fields are required.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Cognito standard attributes: "name", "email", etc.
    const attributeList = [
      new CognitoUserAttribute({
        Name: "name",        // store user's name
        Value: formData.name,
      }),
      new CognitoUserAttribute({
        Name: "email",       // store user's email
        Value: formData.email,
      }),
    ];

    // Sign up user using email as the username
    UserPool.signUp(
      formData.email, 
      formData.password, 
      attributeList, 
      [],
      (err, data) => {
        if (err) {
          alert("Registration error: " + err.message);
          console.error("Error during registration:", err);
        } else {
          console.log("Registration success:", data);
          alert("Registration successful! Check your email for confirmation if required.");
          navigate("/login");
        }
      }
    );
  };

  return (
    <MDBContainer
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
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
        }}
      >
        <h3 style={{ fontWeight: "bold", marginBottom: "20px" }}>Sign Up</h3>
        <form onSubmit={handleSubmit}>
          <MDBInput
            type="text"
            placeholder="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mb-3"
          />
          <MDBInput
            type="email"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mb-3"
          />
          <MDBInput
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mb-3"
          />
          <MDBInput
            type="password"
            placeholder="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="mb-3"
          />
          <MDBBtn
            color="primary"
            type="submit"
            className="w-100"
            style={{ marginBottom: "10px" }}
          >
            Register
          </MDBBtn>
          <p className="text-center" style={{ fontSize: "0.9rem" }}>
            Already have an account?{" "}
            <a
              href="/login"
              style={{
                color: "#007bff",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Log In
            </a>
          </p>
        </form>
      </div>
    </MDBContainer>
  );
};

export default Register;
