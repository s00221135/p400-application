// Home.tsx
import React, { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import { 
  MDBContainer, 
  MDBRow, 
  MDBCol, 
  MDBCard, 
  MDBCardBody, 
  MDBCardTitle, 
  MDBCardText, 
  MDBBtn 
} from "mdb-react-ui-kit";

// API endpoint for retrieving household name (same as join-household endpoint)
const GET_HOUSEHOLD_NAME_API = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/join-household";

const Home: React.FC = () => {
  const [householdName, setHouseholdName] = useState("Gateway Block 5 APT 9");
  const [dndStatus, setDndStatus] = useState<string>("Kelly has Do Not Disturb on until 7 PM");
  const [reservedSpaces, setReservedSpaces] = useState<string>("Living room reserved from 8 PM - 11 PM");
  const [upcomingChores, setUpcomingChores] = useState<string>("It's your turn to take out the bins this week");
  const [notifications, setNotifications] = useState<string>("Electricity bill due in 3 days");
  
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
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
      {/* Option 1: Spacer element */}
      {/* <div style={{ height: "80px" }}></div> */}

      {/* Option 2: Adjust top padding on container */}
      <MDBContainer
        fluid
        className="p-4"
        style={{
          background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
          minHeight: "calc(100vh - 56px)",
          paddingTop: "120px"  // Increase this value if necessary
        }}
      >
        {/* Welcome Header */}
        <MDBRow className="mb-4">
          <MDBCol>
            <MDBCard 
              className="p-4 text-center" 
              style={{ borderRadius: "10px", boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}
            >
              <MDBCardTitle 
                style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "20px" }}
              >
                Welcome to {householdName}!
              </MDBCardTitle>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        {/* Widgets */}
        <MDBRow className="g-4">
          <MDBCol md="4">
            <MDBCard className="p-3" style={{ borderRadius: "10px", backgroundColor: "#e0f7fa", boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
              <MDBCardTitle style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Do Not Disturb</MDBCardTitle>
              <MDBCardText style={{ fontSize: "1.1rem" }}>{dndStatus}</MDBCardText>
            </MDBCard>
          </MDBCol>
          <MDBCol md="4">
            <MDBCard className="p-3" style={{ borderRadius: "10px", backgroundColor: "#fff3e0", boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
              <MDBCardTitle style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Reserved Spaces</MDBCardTitle>
              <MDBCardText style={{ fontSize: "1.1rem" }}>{reservedSpaces}</MDBCardText>
            </MDBCard>
          </MDBCol>
          <MDBCol md="4">
            <MDBCard className="p-3" style={{ borderRadius: "10px", backgroundColor: "#e8f5e9", boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
              <MDBCardTitle style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Upcoming Chores</MDBCardTitle>
              <MDBCardText style={{ fontSize: "1.1rem" }}>{upcomingChores}</MDBCardText>
            </MDBCard>
          </MDBCol>
          <MDBCol md="6">
            <MDBCard className="p-3" style={{ borderRadius: "10px", backgroundColor: "#fce4ec", boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
              <MDBCardTitle style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Notifications</MDBCardTitle>
              <MDBCardText style={{ fontSize: "1.1rem" }}>{notifications}</MDBCardText>
            </MDBCard>
          </MDBCol>
          <MDBCol md="6">
            <MDBCard className="p-3" style={{ borderRadius: "10px", backgroundColor: "#ede7f6", boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
              <MDBCardTitle style={{ fontSize: "1.5rem", marginBottom: "10px" }}>Social Feed</MDBCardTitle>
              <MDBCardText style={{ fontSize: "1.1rem" }}>
                Catch up on the latest happenings, fun stories, and community updates!
              </MDBCardText>
              <MDBBtn color="dark" className="w-100" onClick={() => handleNavigate("/social-feed")}>
                Go to Social Feed
              </MDBBtn>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default Home;
