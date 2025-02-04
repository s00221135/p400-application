import React, { useEffect, useState } from "react";
import { MDBContainer, MDBCard, MDBCardBody, MDBCardTitle, MDBCardText, MDBBtn } from "mdb-react-ui-kit";
import Navigation from "../components/Navigation";

// API endpoint for retrieving household name (same as join-household endpoint)
const GET_HOUSEHOLD_NAME_API = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/join-household";

const Home: React.FC = () => {
  // Default to "Your Household" until the API call updates it.
  const [householdName, setHouseholdName] = useState("Your Household");

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
    // Retrieve tokens (UserID) and HouseholdID from storage
    const tokensString = sessionStorage.getItem("authTokens") || localStorage.getItem("authTokens");
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
          background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
          minHeight: "calc(100vh - 56px)",
          padding: "20px"
        }}
      >
        <MDBCard style={{ maxWidth: "500px", width: "100%", borderRadius: "10px", boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}>
          <MDBCardBody className="text-center">
            <MDBCardTitle style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "20px" }}>
              Welcome to {householdName}!
            </MDBCardTitle>
            <MDBCardText style={{ fontSize: "1.3rem", marginBottom: "20px" }}>
              Home
            </MDBCardText>
            <div style={{ textAlign: "left", marginBottom: "20px" }}>
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
            <MDBBtn
              color="dark"
              className="w-100"
              style={{ fontSize: "1rem", padding: "10px" }}
              onClick={() => handleNavigate("/social-feed")}
            >
              Social Feed
            </MDBBtn>
          </MDBCardBody>
        </MDBCard>
      </MDBContainer>
    </>
  );
};

export default Home;
