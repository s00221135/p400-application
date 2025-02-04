import React, { useState, useEffect } from "react";
import { MDBContainer, MDBInput, MDBBtn } from "mdb-react-ui-kit";

const JoinSpace: React.FC = () => {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);

  useEffect(() => {
    // Check for auth tokens in sessionStorage or localStorage
    const tokensString = sessionStorage.getItem("authTokens") || localStorage.getItem("authTokens");
    const tokens = tokensString ? JSON.parse(tokensString) : null;
    const accessToken = tokens?.accessToken;
    const uID = tokens?.userID;

    // If no valid session, redirect
    if (!accessToken || !uID) {
      alert("No valid session found. Please log in.");
      window.location.href = "/";
      return;
    }
    setUserID(uID);
  }, []);

  const handleJoinHousehold = async () => {
    if (!joinCode.trim()) {
      alert("Please enter a join code.");
      return;
    }
    if (!userID) {
      alert("No user ID found. Please log in.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/join-household",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ JoinCode: joinCode, UserID: userID }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Save the household ID if needed
        localStorage.setItem("HouseholdID", data.HouseholdID);
        alert(`Welcome to ${data.HouseholdName}!`);
        window.location.href = "/home"; // Navigate to home
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error joining household:", error);
      alert("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  return (
    <MDBContainer
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div style={{ padding: "20px", borderRadius: "8px", textAlign: "center" }}>
        <h1>Join a Household</h1>
        <MDBInput
          type="text"
          placeholder="Enter Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="my-4"
        />
        <MDBBtn color="primary" className="w-100" onClick={handleJoinHousehold} disabled={loading}>
          {loading ? "Joining..." : "Join"}
        </MDBBtn>
      </div>
    </MDBContainer>
  );
};

export default JoinSpace;
