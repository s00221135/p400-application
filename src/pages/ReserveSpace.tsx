// ReserveSharedSpace.tsx
import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBInput
} from "mdb-react-ui-kit";

// Set the base URLs for the two separate APIs
const RESERVATIONS_BASE_URL = "https://ikq4o2e4c1.execute-api.eu-west-1.amazonaws.com/dev";
const USERS_BASE_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev";

// Replace this with your dynamic household ID retrieval logic as needed
const HOUSEHOLD_ID = "house-001";

interface Reservation {
  ReservationID: string;
  SpaceName: string;
  ReservedBy: string;
  Purpose: string;
  StartTime: string;
  EndTime: string;
}

interface HouseholdUser {
  UserID: string;
  Name: string;
  Email?: string;
}

// Helper function to format date/time in a more readable format
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-US", options);
};

const ReserveSharedSpace: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [householdUsers, setHouseholdUsers] = useState<HouseholdUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state management
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [newReservation, setNewReservation] = useState<Reservation>({
    ReservationID: "",
    SpaceName: "",
    ReservedBy: "",
    Purpose: "",
    StartTime: "",
    EndTime: ""
  });

  // Preset space options
  const spaceOptions = ["Living Room", "Kitchen", "Dining Room", "Study", "Other"];

  /** ----------------------------------
   * 1) Fetch Reservations (from Reservations API)
   * ---------------------------------- */
  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${RESERVATIONS_BASE_URL}/reservations?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`;
      console.log("Fetching reservations from:", url);
      const response = await fetch(url);
      const textResponse = await response.text();
      console.log("Raw reservations response:", textResponse);

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("JSON Parse Error (reservations):", e);
        setError("Invalid reservations API response format.");
        return;
      }

      if (response.ok) {
        if (!data.reservations || !Array.isArray(data.reservations)) {
          console.warn("No reservations found or incorrect format.");
          setReservations([]);
        } else {
          const sorted = [...data.reservations].sort((a: Reservation, b: Reservation) =>
            a.StartTime.localeCompare(b.StartTime)
          );
          setReservations(sorted);
        }
      } else {
        setError(data.message || "Failed to load reservations.");
      }
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError("Failed to fetch reservations.");
    } finally {
      setLoading(false);
    }
  };

  /** ----------------------------------
   * 2) Fetch Household Users (from Household Users API)
   * ---------------------------------- */
  const fetchHouseholdUsers = async () => {
    try {
      const url = `${USERS_BASE_URL}/household-users?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`;
      console.log("Fetching household users from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch household users");
      }
      const data = await response.json();
      if (Array.isArray(data.users)) {
        setHouseholdUsers(data.users);
      } else {
        console.warn("No 'users' array found in response.");
      }
    } catch (err) {
      console.error("Error fetching household users:", err);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchHouseholdUsers();
  }, []);

  /** ----------------------------------
   * 3) Save (Add or Edit) Reservation
   * ---------------------------------- */
  const saveReservation = async () => {
    if (!newReservation.SpaceName) {
      alert("Please select a space.");
      return;
    }
    if (!newReservation.Purpose.trim()) {
      alert("Please enter a purpose for the reservation.");
      return;
    }
    if (!newReservation.StartTime || !newReservation.EndTime) {
      alert("Start and End times are required.");
      return;
    }
    if (!newReservation.ReservedBy) {
      alert("Please select the reserving user.");
      return;
    }

    const requestMethod = editMode ? "PUT" : "POST";
    const requestUrl = editMode
      ? `${RESERVATIONS_BASE_URL}/reservations/${currentReservation?.ReservationID}?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`
      : `${RESERVATIONS_BASE_URL}/reservations`;

    try {
      const payload = {
        HouseholdID: HOUSEHOLD_ID,
        ...newReservation,
      };

      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchReservations();
        setModalOpen(false);
      } else {
        alert("Failed to save reservation.");
      }
    } catch (err) {
      console.error("Error saving reservation:", err);
      alert("Error saving reservation.");
    }
  };

  /** ----------------------------------
   * 4) Delete Reservation
   * ---------------------------------- */
  const deleteReservation = async (reservationID: string) => {
    if (!window.confirm("Are you sure you want to delete this reservation?")) return;

    try {
      const url = `${RESERVATIONS_BASE_URL}/reservations/${reservationID}?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`;
      const response = await fetch(url, { method: "DELETE" });
      if (response.ok) {
        fetchReservations();
      } else {
        alert("Failed to delete reservation.");
      }
    } catch (err) {
      console.error("Error deleting reservation:", err);
      alert("Error deleting reservation.");
    }
  };

  return (
    <>
      <Navigation />

      <MDBContainer fluid style={{ marginTop: "56px", padding: "2rem" }}>
        <MDBRow className="justify-content-center">
          <MDBCol xs="12" sm="10" md="8" lg="6">
            <h2 className="text-center">Reserve a Shared Space</h2>
            <p className="text-center text-muted">
              Reserve common areas to avoid scheduling conflicts
            </p>

            <div className="text-center mb-3">
              <MDBBtn
                color="primary"
                onClick={() => {
                  setEditMode(false);
                  setNewReservation({
                    ReservationID: "",
                    SpaceName: "",
                    ReservedBy: "",
                    Purpose: "",
                    StartTime: "",
                    EndTime: ""
                  });
                  setModalOpen(true);
                }}
              >
                Add Reservation
              </MDBBtn>
            </div>

            {loading && <p className="text-center text-muted">Loading reservations...</p>}
            {error && <p className="text-danger text-center">{error}</p>}

            {reservations.length === 0 && !loading ? (
              <p className="text-center text-muted">No reservations yet...</p>
            ) : (
              reservations.map((res) => {
                const reservedUser = householdUsers.find((u) => u.UserID === res.ReservedBy);
                const displayReservedBy = reservedUser ? reservedUser.Name : res.ReservedBy;
                return (
                  <MDBCard key={res.ReservationID} className="mb-3">
                    <MDBCardBody>
                      <h5 className="fw-bold">{res.SpaceName}</h5>
                      <p>
                        <strong>Reserved By:</strong> {displayReservedBy}
                      </p>
                      <p>
                        <strong>Purpose:</strong> {res.Purpose}
                      </p>
                      <p>
                        <strong>Start Time:</strong> {formatDateTime(res.StartTime)}
                      </p>
                      <p>
                        <strong>End Time:</strong> {formatDateTime(res.EndTime)}
                      </p>
                      <MDBRow className="mt-2">
                        <MDBCol>
                          <MDBBtn
                            color="info"
                            size="sm"
                            onClick={() => {
                              setEditMode(true);
                              setNewReservation(res);
                              setCurrentReservation(res);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </MDBBtn>
                        </MDBCol>
                        <MDBCol>
                          <MDBBtn
                            color="danger"
                            size="sm"
                            onClick={() => deleteReservation(res.ReservationID)}
                          >
                            Delete
                          </MDBBtn>
                        </MDBCol>
                      </MDBRow>
                    </MDBCardBody>
                  </MDBCard>
                );
              })
            )}
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      <MDBModal open={modalOpen} setOpen={setModalOpen} tabIndex="-1">
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>{editMode ? "Edit Reservation" : "Add Reservation"}</MDBModalTitle>
              <MDBBtn className="btn-close" color="none" onClick={() => setModalOpen(false)}></MDBBtn>
            </MDBModalHeader>
            <MDBModalBody>
              <div className="mb-3">
                <label className="form-label">Select Space</label>
                <select
                  className="form-select"
                  value={newReservation.SpaceName}
                  onChange={(e) =>
                    setNewReservation({ ...newReservation, SpaceName: e.target.value })
                  }
                >
                  <option value="">-- Select a Space --</option>
                  {spaceOptions.map((space) => (
                    <option key={space} value={space}>
                      {space}
                    </option>
                  ))}
                </select>
              </div>
              <MDBInput
                label="Purpose"
                type="text"
                value={newReservation.Purpose}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, Purpose: e.target.value })
                }
                className="mb-3"
              />
              <MDBInput
                label="Start Time"
                type="datetime-local"
                value={newReservation.StartTime}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, StartTime: e.target.value })
                }
                className="mb-3"
              />
              <MDBInput
                label="End Time"
                type="datetime-local"
                value={newReservation.EndTime}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, EndTime: e.target.value })
                }
                className="mb-3"
              />
              <div className="mb-3">
                <label className="form-label">Reserved By</label>
                <select
                  className="form-select"
                  value={newReservation.ReservedBy}
                  onChange={(e) =>
                    setNewReservation({ ...newReservation, ReservedBy: e.target.value })
                  }
                >
                  <option value="">-- Select a Housemate --</option>
                  {householdUsers.map((user) => (
                    <option key={user.UserID} value={user.UserID}>
                      {user.Name}
                    </option>
                  ))}
                </select>
              </div>
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </MDBBtn>
              <MDBBtn color="primary" onClick={saveReservation}>
                Save
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
};

export default ReserveSharedSpace;
