import React from "react";
import { MDBContainer, MDBBtn } from "mdb-react-ui-kit";
import Navigation from "../components/Navigation"; // Ensure this path is correct

const Home: React.FC = () => {
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

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
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            Welcome Home
          </h1>
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "1rem", marginBottom: "10px" }}>
              <strong>Roommate Status:</strong> Fergal has "Do Not Disturb" on
              until 7 PM
            </p>
            <p style={{ fontSize: "1rem", marginBottom: "10px" }}>
              <strong>Reserved Spaces:</strong> Living room reserved from 8 PM -
              11 PM
            </p>
            <p style={{ fontSize: "1rem", marginBottom: "10px" }}>
              <strong>Upcoming Tasks:</strong> Fergal's turn to take out the
              bins this week
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
