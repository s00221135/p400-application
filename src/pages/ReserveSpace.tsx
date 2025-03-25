import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBInput,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBIcon,
} from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const RESERVATIONS_BASE_URL = "https://ikq4o2e4c1.execute-api.eu-west-1.amazonaws.com/dev";
const USERS_BASE_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev";
const READ_USER_URL = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

// Helper: Retrieve session data from sessionStorage and fetch householdID if missing.
const loadSessionData = async (navigate: any): Promise<{ householdID: string; userID: string; userName: string } | null> => {
  const tokensString = sessionStorage.getItem("authTokens");
  if (!tokensString) return null;
  try {
    const tokens = JSON.parse(tokensString);
    const accessToken = tokens.accessToken;
    const userID = tokens.userID;
    let householdID = tokens.householdID || null;
    const userName = tokens.username || tokens.Name || "Current User";
    if (!accessToken || !userID) {
      return null;
    }
    // If householdID is missing, fetch it from the read-user endpoint.
    if (!householdID) {
      const response = await fetch(READ_USER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ UserID: userID }),
      });
      if (response.ok) {
        const data = await response.json();
        householdID = data.HouseholdID;
        if (householdID) {
          tokens.householdID = householdID;
          sessionStorage.setItem("authTokens", JSON.stringify(tokens));
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    return { householdID, userID, userName };
  } catch (error) {
    console.error("Error loading session data:", error);
    return null;
  }
};

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

const ReserveSharedSpace: React.FC = () => {
  const navigate = useNavigate();

  // Session state
  const [householdID, setHouseholdID] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<{ userID: string; userName: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [householdUsers, setHouseholdUsers] = useState<HouseholdUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal state for new reservation
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [newReservation, setNewReservation] = useState<Reservation>({
    ReservationID: "",
    SpaceName: "",
    ReservedBy: "",
    Purpose: "",
    StartTime: "",
    EndTime: "",
  });

  // Preset space options and custom space handling
  const spaceOptions = ["Living Room", "Kitchen", "Dining Room", "Study", "Other"];
  const [useCustomSpace, setUseCustomSpace] = useState<boolean>(false);
  const [customSpaceName, setCustomSpaceName] = useState<string>("");

  // On mount, load session data (using logic from your Profile page)
  useEffect(() => {
    (async () => {
      const session = await loadSessionData(navigate);
      if (!session) {
        setError("No valid user found. Please log in.");
        navigate("/");
      } else {
        setHouseholdID(session.householdID);
        setCurrentUser({
          userID: session.userID,
          userName: session.userName,
          email: "", // Update if available
        });
        setError(null);
      }
    })();
  }, [navigate]);

  // Fetch reservations using householdID from session data
  const fetchReservations = async () => {
    if (!householdID) {
      setError("No valid user found. Please log in.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${RESERVATIONS_BASE_URL}/reservations?HouseholdID=${encodeURIComponent(householdID)}`;
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
          setReservations([]);
        } else {
          const now = new Date();
          const activeReservations = data.reservations.filter(
            (res: Reservation) => new Date(res.EndTime) > now
          );
          // Optionally delete expired reservations:
          data.reservations.forEach((res: Reservation) => {
            if (new Date(res.EndTime) <= now) {
              deleteReservation(res.ReservationID, false);
            }
          });
          activeReservations.sort((a: Reservation, b: Reservation) =>
            a.StartTime.localeCompare(b.StartTime)
          );
          setReservations(activeReservations);
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

  // Delete a reservation
  const deleteReservation = async (reservationID: string, refresh: boolean = true) => {
    if (!currentUser || !householdID) {
      alert("No valid user found. Please log in.");
      return;
    }
    const url = `${RESERVATIONS_BASE_URL}/reservations/${reservationID}?HouseholdID=${encodeURIComponent(
      householdID
    )}&UserID=${encodeURIComponent(currentUser.userID)}`;
    try {
      const response = await fetch(url, { method: "DELETE" });
      if (response.ok && refresh) {
        fetchReservations();
      }
    } catch (err) {
      console.error("Error deleting reservation:", err);
    }
  };

  // Fetch household users
  const fetchHouseholdUsers = async () => {
    if (!householdID) return;
    try {
      const url = `${USERS_BASE_URL}/household-users?HouseholdID=${encodeURIComponent(householdID)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch household users");
      const data = await response.json();
      if (Array.isArray(data.users)) {
        setHouseholdUsers(data.users);
      }
    } catch (err) {
      console.error("Error fetching household users:", err);
    }
  };

  useEffect(() => {
    if (householdID) {
      fetchReservations();
      fetchHouseholdUsers();
    }
  }, [householdID]);

  // Auto-delete expired reservations every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      reservations.forEach((res) => {
        if (new Date(res.EndTime) <= now) {
          deleteReservation(res.ReservationID, false);
        }
      });
      fetchReservations();
    }, 60000);
    return () => clearInterval(interval);
  }, [reservations, currentUser]);

  // Save a new reservation (no editing allowed)
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
    if (!currentUser || !householdID) {
      alert("No valid user found. Please log in.");
      return;
    }
    if (useCustomSpace) {
      newReservation.SpaceName = customSpaceName.trim();
      if (!newReservation.SpaceName) {
        alert("Please enter a custom space name.");
        return;
      }
    }
    const reservationToSave = {
      ...newReservation,
      ReservedBy: currentUser.userID,
      ApprovalStatus: "Pending",
      Approvers: [],
    };
    const payload = {
      HouseholdID: householdID,
      ...reservationToSave,
    };
    try {
      const response = await fetch(`${RESERVATIONS_BASE_URL}/reservations`, {
        method: "POST",
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
                  setNewReservation({
                    ReservationID: "",
                    SpaceName: "",
                    ReservedBy: "",
                    Purpose: "",
                    StartTime: "",
                    EndTime: "",
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
                const reservedUser = householdUsers.find((u) => u.UserID === res.ReservedBy);
                const displayReservedBy = reservedUser ? reservedUser.Name : res.ReservedBy;
                if (new Date(res.EndTime) <= new Date()) return null;
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
                      <p>
                        <strong>Status:</strong> {res.ApprovalStatus || "Pending"}
                      </p>
                      {currentUser?.userID === res.ReservedBy && (
                        <MDBBtn
                          color="danger"
                          size="sm"
                          onClick={() => deleteReservation(res.ReservationID)}
                        >
                          Delete
                        </MDBBtn>
                      )}
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
              <MDBModalTitle>Add Reservation</MDBModalTitle>
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
                onChange={(e) => setNewReservation({ ...newReservation, Purpose: e.target.value })}
                className="mb-3"
              />
              <MDBInput
                label="Start Time"
                type="datetime-local"
                value={newReservation.StartTime}
                onChange={(e) => setNewReservation({ ...newReservation, StartTime: e.target.value })}
                className="mb-3"
              />
              <MDBInput
                label="End Time"
                type="datetime-local"
                value={newReservation.EndTime}
                onChange={(e) => setNewReservation({ ...newReservation, EndTime: e.target.value })}
                className="mb-3"
              />
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </MDBBtn>
              <MDBBtn color="primary" onClick={saveReservation}>
                Save Reservation
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
};

export default ReserveSharedSpace;
