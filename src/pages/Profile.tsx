import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBRow,
  MDBCol,
  MDBBtn,
  MDBSpinner,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBInput,
} from "mdb-react-ui-kit";
import Navigation from "../components/Navigation";

interface User {
  UserID: string;
  Name: string;
  Email: string;
  College: string;
  AreaOfStudy: string;
  CreatedAt: string;
  DoNotDisturb: boolean;
  HouseholdID: string | null;
  Latitude: number;
  Longitude: number;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      // Use sessionStorage instead of localStorage
      const tokensString = sessionStorage.getItem("authTokens");
      const tokens = tokensString ? JSON.parse(tokensString) : null;
      const accessToken = tokens?.accessToken;
      const userID = tokens?.userID;

      if (!accessToken || !userID) {
        alert("No valid session found. Please log in.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch(
          "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            // Send the userID in the body so the Lambda can find the record
            body: JSON.stringify({ UserID: userID }),
          }
        );

        console.log("API Response Status:", response.status);

        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          sessionStorage.removeItem("authTokens");
          navigate("/");
          return;
        }

        if (response.status === 404) {
          alert("User not found.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          alert(`Error: ${errorData.message}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("User Data Retrieved:", data);
        setUser(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("An error occurred while fetching user data.");
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Open edit modal and prefill with current user data
  const openEditModal = () => {
    setEditedUser(user);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
  };

  // Handle changes in the edit modal inputs
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedUser) {
      setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
    }
  };

  // Toggle the Do Not Disturb flag
  const handleToggleDND = () => {
    if (editedUser) {
      setEditedUser({ ...editedUser, DoNotDisturb: !editedUser.DoNotDisturb });
    }
  };

  // Save the edits by calling the update-user endpoint
  const saveEdits = async () => {
    if (!editedUser) return;

    const tokensString = sessionStorage.getItem("authTokens");
    const tokens = tokensString ? JSON.parse(tokensString) : null;
    const accessToken = tokens?.accessToken;

    if (!accessToken) {
      alert("No valid session found. Please log in.");
      navigate("/");
      return;
    }

    try {
      const response = await fetch(
        "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/update-user",
        {
          method: "PUT", // Ensure this matches your API Gateway method for update
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          // Send the entire editedUser object (which should include UserID)
          body: JSON.stringify(editedUser),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error updating profile: ${errorData.message}`);
        return;
      }

      const updatedData = await response.json();
      console.log("Updated User Data:", updatedData);

      // Adjust according to your Lambda response structure.
      // Example assumes it might return "UpdatedItem" or the entire user object directly.
      setUser(updatedData.UpdatedItem || updatedData);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred while updating your profile.");
    }
  };

  if (loading) {
    return (
      <MDBContainer
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <MDBSpinner grow color="primary" />
      </MDBContainer>
    );
  }

  if (!user) {
    return <div>No user data available.</div>;
  }

  return (
    <>
      <Navigation />

      <MDBContainer className="mt-5">
        <MDBRow className="justify-content-center">
          <MDBCol md="8">
            <MDBCard>
              <MDBCardBody>
                <MDBRow className="mb-3">
                  <MDBCol>
                    <MDBCardTitle>Profile</MDBCardTitle>
                  </MDBCol>
                </MDBRow>

                <MDBRow>
                  <MDBCol md="6" className="mb-3">
                    <MDBCardText className="text-start">
                      <strong>Name:</strong> {user.Name}
                    </MDBCardText>
                    <MDBCardText className="text-start">
                      <strong>Email:</strong> {user.Email}
                    </MDBCardText>
                  </MDBCol>
                  <MDBCol md="6" className="mb-3">
                    <MDBCardText className="text-start">
                      <strong>College:</strong> {user.College}
                    </MDBCardText>
                    <MDBCardText className="text-start">
                      <strong>Area of Study:</strong> {user.AreaOfStudy}
                    </MDBCardText>
                    <MDBCardText className="text-start">
                      <strong>Created At:</strong>{" "}
                      {new Date(user.CreatedAt).toLocaleString()}
                    </MDBCardText>
                  </MDBCol>
                </MDBRow>

                <hr />

                <MDBRow className="mb-2">
                  <MDBCol>
                    <MDBCardText className="text-start">
                      <strong>Do Not Disturb:</strong>{" "}
                      {user.DoNotDisturb ? "Active" : "Off"}
                    </MDBCardText>
                  </MDBCol>
                </MDBRow>

                <MDBRow>
                  <MDBCol className="text-end">
                    <MDBBtn color="primary" onClick={openEditModal}>
                      Edit Profile
                    </MDBBtn>
                  </MDBCol>
                </MDBRow>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      {editedUser && (
        <MDBModal tabIndex="-1" show={editModalOpen} setShow={setEditModalOpen}>
          <MDBModalDialog>
            <MDBModalContent>
              <MDBModalHeader>
                <MDBModalTitle>Edit Profile</MDBModalTitle>
                <MDBBtn
                  className="btn-close"
                  color="none"
                  onClick={closeEditModal}
                ></MDBBtn>
              </MDBModalHeader>
              <MDBModalBody>
                <div className="mb-3">
                  <label>Name</label>
                  <MDBInput
                    type="text"
                    name="Name"
                    value={editedUser.Name}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="mb-3">
                  <label>College</label>
                  <MDBInput
                    type="text"
                    name="College"
                    value={editedUser.College}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="mb-3">
                  <label>Area of Study</label>
                  <MDBInput
                    type="text"
                    name="AreaOfStudy"
                    value={editedUser.AreaOfStudy}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="mb-3">
                  <label>Do Not Disturb</label>
                  <MDBBtn
                    color={editedUser.DoNotDisturb ? "success" : "secondary"}
                    onClick={handleToggleDND}
                  >
                    {editedUser.DoNotDisturb ? "Active" : "Off"}
                  </MDBBtn>
                </div>
              </MDBModalBody>
              <MDBModalFooter>
                <MDBBtn color="secondary" onClick={closeEditModal}>
                  Cancel
                </MDBBtn>
                <MDBBtn color="primary" onClick={saveEdits}>
                  Save Changes
                </MDBBtn>
              </MDBModalFooter>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>
      )}
    </>
  );
};

export default Profile;
