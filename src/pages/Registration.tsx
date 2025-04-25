import React, { useState } from "react";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBBtn,
} from "mdb-react-ui-kit";
import { CognitoUserAttribute } from "amazon-cognito-identity-js";
import { useNavigate } from "react-router-dom";
import UserPool from "../Cognito";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

async function createUserInDynamo(userData: any) {
  try {
    const response = await fetch("https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/create-user", {
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

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      alert("All fields are required.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Cognito attributes: name and email
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

        const userId = data?.userSub;
        if (userId) {
          // Create user in DynamoDB
          await createUserInDynamo({
            UserID: userId,
            Name: formData.name,
            Email: formData.email,
            CreatedAt: new Date().toISOString(),
            DoNotDisturb: false,
            HouseholdID: null,
            AreaOfStudy: "Unknown",
            College: "Unknown",
            Password: "StoredInCognito",
          });
        }

        // Pass both email and password to the Confirm page for automatic sign-in later
        navigate("/confirm", { state: { email: formData.email, password: formData.password } });
      }
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
            <h4 style={{ fontWeight: "bold", marginBottom: "20px" }}>Sign Up</h4>
          </div>
          <form onSubmit={handleSubmit}>
            <MDBInput
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mb-3"
              required
            />
            <MDBInput
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mb-3"
              required
            />
            <MDBInput
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mb-3"
              required
            />
            <MDBInput
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mb-3"
              required
            />
            <MDBBtn
              color="primary"
              type="submit"
              className="w-100"
              style={{ marginBottom: "10px", padding: "10px", fontSize: "1rem" }}
            >
              Register
            </MDBBtn>
            <p className="text-center" style={{ fontSize: "0.9rem", color: "#555" }}>
              Already have an account?{" "}
              <a href="/" style={{ color: "#007bff", textDecoration: "none" }}>
                Log In
              </a>
            </p>
          </form>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
};

export default Register;
