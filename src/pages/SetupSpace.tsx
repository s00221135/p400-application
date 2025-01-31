import React from "react";
import { MDBContainer, MDBBtn } from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const SetupSpace: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MDBContainer fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div style={{ padding: "30px", borderRadius: "8px", textAlign: "center" }}>
        <h3>Welcome</h3>
        <h1>Set up your Space</h1>
        <p>Create a new household, join with a code, or skip to the community feed</p>
        
        <MDBBtn color="dark" className="w-100 mb-3" onClick={() => navigate("/create-space")}>
          Create a Space
        </MDBBtn>
        
        <MDBBtn color="dark" className="w-100 mb-3" onClick={() => navigate("/join-space")}>
          Join a Space
        </MDBBtn>
        
        <div style={{ marginTop: "20px" }}>
          <p>Not joining a Space?</p>
          <MDBBtn color="light" className="w-100" onClick={() => navigate("/home")}>
            Skip
          </MDBBtn>
        </div>
      </div>
    </MDBContainer>
  );
};

export default SetupSpace;
