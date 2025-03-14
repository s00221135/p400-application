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

const RESERVATIONS_BASE_URL = "https://ikq4o2e4c1.execute-api.eu-west-1.amazonaws.com/dev";
const USERS_BASE_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev";
const HOUSEHOLD_ID = "house-001";

// --- Interfaces ---
interface Reservation {
  ReservationID: string;
  SpaceName: string;
  ReservedBy: string;
  Purpose: string;
  StartTime: string;
  EndTime: string;
  ApprovalStatus?: "Pending" | "Approved" | "Rejected";
  Approvers?: string[];
}

interface HouseholdUser {
  UserID: string;
  Name: string;
  Email?: string;
}

// Helper to format datetime
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

  // Current logged-in user
  const [currentUser, setCurrentUser] = useState<HouseholdUser | null>(null);

  // Modal states
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

  // Preset spaces
  const spaceOptions = ["Living Room", "Kitchen", "Dining Room", "Study", "Other"];

  // For handling "Other" (custom space name)
  const [useCustomSpace, setUseCustomSpace] = useState<boolean>(false);
  const [customSpaceName, setCustomSpaceName] = useState<string>("");

  // ------------------ Fetch Reservations ------------------
  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${RESERVATIONS_BASE_URL}/reservations?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`;
      const response = await fetch(url);
      const textResponse = await response.text();
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
          console.warn("No reservations array found.");
          setReservations([]);
        } else {
          // Sort by StartTime ascending
          const sorted = [...data.reservations].sort(
            (a: Reservation, b: Reservation) => a.StartTime.localeCompare(b.StartTime)
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

  // ------------------ Fetch Household Users ------------------
  const fetchHouseholdUsers = async () => {
    try {
      const url = `${USERS_BASE_URL}/household-users?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`;
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

  // ------------------ useEffect (on mount) ------------------
  useEffect(() => {
    fetchReservations();
    fetchHouseholdUsers();

    // Example: set current user from sessionStorage
    const tokensString = sessionStorage.getItem("authTokens");
    if (tokensString) {
      const tokens = JSON.parse(tokensString);
      setCurrentUser({
        UserID: tokens.userID,
        Name: tokens.name || "Current User"
      });
    }
  }, []);

  // ------------------ Save (Add or Edit) Reservation ------------------
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
    if (!currentUser) {
      alert("No valid user found. Please log in.");
      return;
    }

    // If "Other" was selected, override the SpaceName with the custom input
    if (useCustomSpace) {
      newReservation.SpaceName = customSpaceName.trim();
      if (!newReservation.SpaceName) {
        alert("Please enter a custom space name.");
        return;
      }
    }

    // The user who created or is editing:
    const requestingUserId = currentUser.UserID;

    const reservationToSave = {
      ...newReservation,
      ReservedBy: editMode
        ? newReservation.ReservedBy // Keep the original
        : currentUser.UserID, // If new, assign
    };

    const requestMethod = editMode ? "PUT" : "POST";
    const requestUrl = editMode
      ? // For editing, we must pass the ReservationID in path
        `${RESERVATIONS_BASE_URL}/reservations/${currentReservation?.ReservationID}?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`
      : // For new
        `${RESERVATIONS_BASE_URL}/reservations`;

    try {
      // The backend uses "RequestUserID" to check ownership
      const payload = {
        HouseholdID: HOUSEHOLD_ID,
        RequestUserID: requestingUserId,  // <-- pass user ID for ownership check
        ...reservationToSave,
      };

      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setModalOpen(false);
        fetchReservations();
      } else {
        const errText = await response.text();
        alert(`Failed to save reservation: ${errText}`);
      }
    } catch (err) {
      console.error("Error saving reservation:", err);
      alert("Error saving reservation.");
    }
  };

  // ------------------ Delete Reservation ------------------
  const deleteReservation = async (reservationID: string) => {
    if (!currentUser) {
      alert("No valid user found. Please log in.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this reservation?")) return;

    // For ownership checks, the Lambda expects "UserID" as a query param in DELETE
    const url = `${RESERVATIONS_BASE_URL}/reservations/${reservationID}?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}&UserID=${encodeURIComponent(currentUser.UserID)}`;

    try {
      const response = await fetch(url, { method: "DELETE" });
      if (response.ok) {
        fetchReservations();
      } else {
        const errorText = await response.text();
        alert("Failed to delete reservation: " + errorText);
      }
    } catch (err) {
      console.error("Error deleting reservation:", err);
      alert("Error deleting reservation.");
    }
  };

  // ------------------ Approve or Reject ------------------
  const handleApproval = async (reservation: Reservation, action: "Approve" | "Reject") => {
    if (!currentUser) {
      alert("You must be logged in to approve/reject reservations.");
      return;
    }
    try {
      const url = `${RESERVATIONS_BASE_URL}/reservations/${reservation.ReservationID}/approve?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Action: action,
          UserID: currentUser.UserID,
        }),
      });

      if (response.ok) {
        fetchReservations();
      } else {
        const errorText = await response.text();
        alert("Failed to update approval status: " + errorText);
      }
    } catch (err) {
      console.error("Error approving reservation:", err);
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
                  setUseCustomSpace(false);
                  setCustomSpaceName("");
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
                // Lookup the user details from householdUsers to display their name
                const reservedUser = householdUsers.find((u) => u.UserID === res.ReservedBy);
                const displayReservedBy = reservedUser ? reservedUser.Name : res.ReservedBy;

                return (
                  <MDBCard key={res.ReservationID} className="mb-3">
                    <MDBCardBody>
                      <h5 className="fw-bold">{res.SpaceName}</h5>
                      <p><strong>Reserved By:</strong> {displayReservedBy}</p>
                      <p><strong>Purpose:</strong> {res.Purpose}</p>
                      <p><strong>Start Time:</strong> {formatDateTime(res.StartTime)}</p>
                      <p><strong>End Time:</strong> {formatDateTime(res.EndTime)}</p>
                      <p>
                        <strong>Status:</strong> {res.ApprovalStatus || "Pending"}
                      </p>

                      {/* Approve/Reject if user != reserving user & status is Pending */}
                      {currentUser?.UserID !== res.ReservedBy &&
                        res.ApprovalStatus === "Pending" && (
                          <div className="mb-2">
                            <MDBBtn
                              color="success"
                              size="sm"
                              onClick={() => handleApproval(res, "Approve")}
                              className="me-2"
                            >
                              Approve
                            </MDBBtn>
                            <MDBBtn
                              color="warning"
                              size="sm"
                              onClick={() => handleApproval(res, "Reject")}
                            >
                              Reject
                            </MDBBtn>
                          </div>
                      )}

                      {/* Edit/Delete only if current user is the one who created it */}
                      {currentUser?.UserID === res.ReservedBy && (
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

                                // If space is custom
                                if (!spaceOptions.includes(res.SpaceName)) {
                                  setUseCustomSpace(true);
                                  setCustomSpaceName(res.SpaceName);
                                } else {
                                  setUseCustomSpace(res.SpaceName === "Other");
                                }
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
                      )}
                    </MDBCardBody>
                  </MDBCard>
                );
              })
            )}
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      {/* ------------------ ADD/EDIT MODAL ------------------ */}
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
                  value={useCustomSpace ? "Other" : newReservation.SpaceName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "Other") {
                      setUseCustomSpace(true);
                      setNewReservation({ ...newReservation, SpaceName: "Other" });
                    } else {
                      setUseCustomSpace(false);
                      setNewReservation({ ...newReservation, SpaceName: value });
                      setCustomSpaceName("");
                    }
                  }}
                >
                  <option value="">-- Select a Space --</option>
                  {spaceOptions.map((space) => (
                    <option key={space} value={space}>
                      {space}
                    </option>
                  ))}
                </select>
              </div>

              {useCustomSpace && (
                <MDBInput
                  label="Custom Space Name"
                  type="text"
                  value={customSpaceName}
                  onChange={(e) => setCustomSpaceName(e.target.value)}
                  className="mb-3"
                />
              )}

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
