import React, { useState, useEffect } from "react";
import { MDBContainer, MDBInput, MDBBtn } from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const CreateSpace: React.FC = () => {
  const [householdName, setHouseholdName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve tokens from sessionStorage in the same way as your Profile page
    const tokensString = sessionStorage.getItem("authTokens");
    const tokens = tokensString ? JSON.parse(tokensString) : null;
    const accessToken = tokens?.accessToken;
    const uID = tokens?.userID;

    if (!accessToken || !uID) {
      alert("No valid session found. Please log in.");
      navigate("/");
      return;
    }

    // Store the user ID in state
    setUserID(uID);
  }, [navigate]);

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      alert("Please enter a household name.");
      return;
    }

    if (!userID) {
      alert("No user ID found. Please log in.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/create-household",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            HouseholdName: householdName,
            UserID: userID, // <--- Passing the user ID here
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setJoinCode(data.JoinCode);
        // Optionally store the new household ID in sessionStorage if needed
        // sessionStorage.setItem("HouseholdID", data.HouseholdID);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error creating household:", error);
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
      <div
        style={{ padding: "20px", borderRadius: "8px", textAlign: "center" }}
      >
        <h1>Create New Household</h1>
        <MDBInput
          type="text"
          placeholder="Household Name"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          className="my-4"
        />
        <MDBBtn
          color="primary"
          className="w-100 mb-3"
          onClick={handleCreateHousehold}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Household"}
        </MDBBtn>

        {joinCode && (
          <div>
            <p>
              Share this join code with your roommates: <b>{joinCode}</b>
            </p>
            <MDBBtn
              color="success"
              className="w-100"
              onClick={() => (window.location.href = "/home")}
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
