// src/pages/Register.tsx
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

// Helper to call your create-user API
async function createUserInDynamo(userData: any) {
  try {
    // Adjust the URL to match your API Gateway endpoint
    const response = await fetch("https://mapox7awv0.execute-api.eu-west-1.amazonaws.com/dev/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Failed to create user in Dynamo");
    }

    const data = await response.json();
    console.log("Created user in DynamoDB:", data);
  } catch (error) {
    console.error("Error creating user in Dynamo:", error);
  }
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

    // Cognito standard attributes: "name" and "email"
    const attributeList = [
      new CognitoUserAttribute({ Name: "name", Value: formData.name }),
      new CognitoUserAttribute({ Name: "email", Value: formData.email }),
    ];

    // Sign up user using email as the username
    UserPool.signUp(formData.email, formData.password, attributeList, [], async (err, data) => {
      if (err) {
        alert("Registration error: " + err.message);
        console.error("Error during registration:", err);
      } else {
        console.log("Registration success:", data);
        alert("Registration successful! Check your email for confirmation if required.");

        // data.userSub is the Cognito 'sub' (unique user ID)
        const userId = data?.userSub;
        if (userId) {
          // Create user in DynamoDB
          await createUserInDynamo({
            UserID: userId,
            Name: formData.name,
            Email: formData.email,
            // Additional fields:
            CreatedAt: new Date().toISOString(),
            DoNotDisturb: false,
            HouseholdID: null,
            AreaOfStudy: "Unknown",
            College: "Unknown",
            // Typically don't store real password in DB since Cognito manages it
            Password: "StoredInCognito",
          });
        }

        // Navigate to the Confirm page and pass the email
        navigate("/confirm", { state: { email: formData.email } });
      }
    });
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
