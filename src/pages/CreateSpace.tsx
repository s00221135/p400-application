import React, { useState } from "react";
import { MDBContainer, MDBInput, MDBBtn } from "mdb-react-ui-kit";

const CreateSpace: React.FC = () => {
  const [householdName, setHouseholdName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const handleCreateHousehold = () => {
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit join code
    setJoinCode(generatedCode);
    console.log("Household Created:", { householdName, joinCode: generatedCode });
  };

  const handleCopyCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      alert("Join code copied to clipboard!");
    }
  };

  return (
    <MDBContainer
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "20px",
        width: "100vw",
        maxWidth: "100vw",
      }}
    >
      <div
        style={{
          backgroundColor: "#e0e0e0",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "90%",
          width: "100%",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Create New Household</h1>
        <MDBInput
          type="text"
          placeholder="Household Name"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          className="my-4"
          style={{ padding: "10px", fontSize: "1rem" }}
        />
        <MDBBtn
          color="primary"
          className="w-100 mb-3 no-expand"
          onClick={handleCreateHousehold}
          style={{
            fontSize: "1rem",
            padding: "10px",
          }}
        >
          Create Household
        </MDBBtn>
        {joinCode && (
          <div>
            <p style={{ fontSize: "0.9rem", marginTop: "20px" }}>
              Share this code with your roommates to add them to your household. Keep it secure!
            </p>
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                marginBottom: "10px",
                fontSize: "1.2rem",
                fontWeight: "bold",
              }}
            >
              {joinCode}
            </div>
            <MDBBtn
              color="dark"
              className="w-100 mb-3 no-expand"
              onClick={handleCopyCode}
              style={{
                fontSize: "1rem",
                padding: "10px",
              }}
            >
              Copy
            </MDBBtn>
            <MDBBtn
              color="success"
              className="w-100 no-expand"
              style={{
                fontSize: "1rem",
                padding: "10px",
              }}
              onClick={() => (window.location.href = "/home")} // Simulate navigation
            >
              Go to Home
            </MDBBtn>
          </div>
        )}
      </div>
    </MDBContainer>
  );
};

export default CreateSpace;
