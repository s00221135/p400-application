import React from "react";
import { MDBContainer, MDBBtn } from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const SetupSpace: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateSpace = () => {
    console.log("Create Space button clicked");
    navigate("/create-space"); // Navigate to Create Space page
  };

  const handleJoinSpace = () => {
    console.log("Join Space button clicked");
    navigate("/join-space"); // Navigate to Join Space page
  };

  const handleSkip = () => {
    console.log("Skip button clicked");
    navigate("/home"); // Navigate to Home page
  };

  return (
    <MDBContainer
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#e0e0e0",
          padding: "30px",
          borderRadius: "8px",
          maxWidth: "90%",
          width: "100%",
          textAlign: "center",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
        <h3 style={{ fontWeight: "bold" }}>Welcome</h3>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Set up your Space</h1>
        <p>Create a new household, join with a code, or skip to the community feed</p>
        
        <MDBBtn
          color="dark"
          className="w-100 mb-3"
          style={{
            padding: "10px",
            fontSize: "1rem",
          }}
          onClick={handleCreateSpace} // Navigate to Create Space
        >
          Create a Space
        </MDBBtn>
        
        <MDBBtn
          color="dark"
          className="w-100 mb-3"
          style={{
            padding: "10px",
            fontSize: "1rem",
          }}
          onClick={handleJoinSpace} // Navigate to Join Space
        >
          Join a Space
        </MDBBtn>
        
        <div style={{ marginTop: "20px" }}>
          <p style={{ fontSize: "0.9rem" }}>Not joining a Space?</p>
          <MDBBtn
            color="light"
            className="w-100"
            style={{
              padding: "10px",
              fontSize: "1rem",
            }}
            onClick={handleSkip} // Navigate to Home
          >
            Skip
          </MDBBtn>
        </div>
      </div>
    </MDBContainer>
  );
};

export default SetupSpace;
