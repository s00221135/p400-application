import React, { useEffect, useState } from "react";
import { MDBContainer, MDBBtn } from "mdb-react-ui-kit";
import Navigation from "../components/Navigation";

// Use the same API endpoint as join-household for retrieving the household name.
const GET_HOUSEHOLD_NAME_API = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/join-household";

const Home: React.FC = () => {
  const [householdName, setHouseholdName] = useState("Your Household");

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
    // Retrieve tokens (UserID) and HouseholdID from storage
    const tokensString =
      sessionStorage.getItem("authTokens") || localStorage.getItem("authTokens");
    const tokens = tokensString ? JSON.parse(tokensString) : null;
    const userID = tokens?.userID;
    const storedHouseholdID = localStorage.getItem("HouseholdID");

    if (!userID || !storedHouseholdID) {
      console.warn("Missing UserID or HouseholdID");
      return;
    }

    const fetchHouseholdName = async () => {
      try {
        const response = await fetch(GET_HOUSEHOLD_NAME_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ UserID: userID, HouseholdID: storedHouseholdID })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.HouseholdName) {
            setHouseholdName(data.HouseholdName);
            localStorage.setItem("HouseholdName", data.HouseholdName);
          }
        } else {
          console.error("Failed to fetch household name");
        }
      } catch (err) {
        console.error("Error fetching household name:", err);
      }
    };

    fetchHouseholdName();
  }, []);

  return (
    <>
      <Navigation />
      <MDBContainer
        fluid
        className="d-flex justify-content-center align-items-center"
        style={{
          backgroundColor: "#f5f5f5",
          minHeight: "calc(100vh - 56px)",
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
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Welcome to {householdName}!
          </h1>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            Home
          </h2>
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "1rem", marginBottom: "10px" }}>
              <strong>Roommate Status:</strong> Fergal has "Do Not Disturb" on until 7 PM
            </p>
            <p style={{ fontSize: "1rem", marginBottom: "10px" }}>
              <strong>Reserved Spaces:</strong> Living room reserved from 8 PM - 11 PM
            </p>
            <p style={{ fontSize: "1rem", marginBottom: "10px" }}>
              <strong>Upcoming Tasks:</strong> Fergal's turn to take out the bins this week
            </p>
            <p style={{ fontSize: "1rem" }}>
              <strong>Notifications:</strong> Electricity bill due in 3 days
            </p>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <MDBBtn
              color="dark"
              className="w-100"
              style={{ fontSize: "1rem", padding: "10px" }}
              onClick={() => handleNavigate("/social-feed")}
            >
              Social Feed
            </MDBBtn>
          </div>
        </div>
      </MDBContainer>
    </>
  );
};

export default Home;
