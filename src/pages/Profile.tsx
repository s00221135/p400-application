import React, { useState } from "react";
import Navigation from "../components/Navigation"; // Adjust the import path if needed
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBBtn,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBInput,
  MDBSwitch,
} from "mdb-react-ui-kit";

interface UserDetails {
  UserID: string;
  Name: string;
  Email: string;
  College: string;
  AreaOfStudy: string;
  CreatedAt: string;      // We'll show this as read-only
  DoNotDisturb: boolean;  // We'll toggle this in the modal
}

const Profile: React.FC = () => {
  // Hard-coded user data (no API calls)
  const [user, setUser] = useState<UserDetails>({
    UserID: "12345-abcde",
    Name: "John Doe",
    Email: "johndoe@atu.ie",
    College: "ATU Sligo",
    AreaOfStudy: "Software Development",
    CreatedAt: "2025-01-18T10:00:00Z",
    DoNotDisturb: false,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // For editing
  const [editUser, setEditUser] = useState<UserDetails>(user);

  // Open the edit modal, copying current user data
  const handleEdit = () => {
    setEditUser(user);
    setModalOpen(true);
  };

  // Update local edit state as user types
  const handleChange = (field: keyof UserDetails, value: string | boolean) => {
    setEditUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // When user clicks "Save"
  const handleSave = () => {
    console.log("Saving changes to user:", editUser);
    // In a real app, you'd do an API PUT/POST here.
    setUser(editUser);
    setModalOpen(false);
  };

  return (
    <>
      <Navigation />

      {/* Center the card and ensure content isn't behind a fixed navbar */}
      <MDBContainer
        fluid
        className="py-4"
        style={{ marginTop: "56px" }} // offset for fixed navbar; remove if not using fixed nav
      >
        <MDBRow className="justify-content-center">
          <MDBCol xs="12" sm="10" md="8" lg="6">
            <MDBCard className="text-center">
              <MDBCardBody>
                {/* Page Title */}
                <MDBRow className="mb-3">
                  <MDBCol>
                    <MDBCardTitle>Profile</MDBCardTitle>
                  </MDBCol>
                </MDBRow>

                {/* Profile Fields */}
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

                {/* Edit Button */}
                <MDBRow>
                  <MDBCol className="text-end">
                    <MDBBtn color="primary" onClick={handleEdit}>
                      Edit Profile
                    </MDBBtn>
                  </MDBCol>
                </MDBRow>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      {/* Edit Modal */}
      <MDBModal show={modalOpen} setShow={setModalOpen}>
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>Edit Profile</MDBModalTitle>
              <MDBBtn
                className="btn-close"
                color="none"
                onClick={() => setModalOpen(false)}
              />
            </MDBModalHeader>
            <MDBModalBody>
              <MDBInput
                label="Name"
                type="text"
                className="mb-3"
                value={editUser.Name}
                onChange={(e) => handleChange("Name", e.target.value)}
              />
              <MDBInput
                label="Email"
                type="email"
                className="mb-3"
                value={editUser.Email}
                onChange={(e) => handleChange("Email", e.target.value)}
              />
              <MDBInput
                label="College"
                type="text"
                className="mb-3"
                value={editUser.College}
                onChange={(e) => handleChange("College", e.target.value)}
              />
              <MDBInput
                label="Area of Study"
                type="text"
                className="mb-3"
                value={editUser.AreaOfStudy}
                onChange={(e) => handleChange("AreaOfStudy", e.target.value)}
              />
              <MDBSwitch
                id="dndSwitch"
                label="Do Not Disturb"
                checked={editUser.DoNotDisturb}
                onChange={() =>
                  handleChange("DoNotDisturb", !editUser.DoNotDisturb)
                }
              />
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </MDBBtn>
              <MDBBtn color="primary" onClick={handleSave}>
                Save
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
};

export default Profile;
