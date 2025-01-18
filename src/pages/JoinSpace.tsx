import React, { useState } from "react";
import { MDBContainer, MDBInput, MDBBtn } from "mdb-react-ui-kit";

const JoinSpace: React.FC = () => {
  const [joinCode, setJoinCode] = useState("");

  const handleJoinHousehold = () => {
    console.log("Joining Household with Code:", joinCode);
    // Simulate navigation or joining functionality
    alert(`You have joined the household with code: ${joinCode}`);
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
          maxWidth: "90%",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Join a Household</h1>
        <p style={{ marginBottom: "20px" }}>
          Enter the code provided by your housemate to join the household.
        </p>
        <MDBInput
          type="text"
          placeholder="Enter Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="my-4"
          style={{ fontSize: "1rem", padding: "10px" }}
        />
        <MDBBtn
          color="primary"
          className="w-100"
          onClick={handleJoinHousehold}
          style={{ fontSize: "1rem", padding: "10px" }}
        >
          Join
        </MDBBtn>
      </div>
    </MDBContainer>
  );
};

export default JoinSpace;
