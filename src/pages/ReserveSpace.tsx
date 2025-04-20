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
const USERS_BASE_URL        = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev";
const READ_USER_URL         = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

// Helper: Retrieve session data and fetch householdID if missing.
const loadSessionData = async (
  navigate: any
): Promise<{ householdID: string; userID: string; userName: string } | null> => {
  const tokensString = sessionStorage.getItem("authTokens");
  if (!tokensString) return null;
  try {
    const tokens = JSON.parse(tokensString);
    const { accessToken, userID } = tokens;
    let householdID = tokens.householdID || null;
    const userName = tokens.username || tokens.Name || "Current User";
    if (!accessToken || !userID) return null;

    if (!householdID) {
      const resp = await fetch(READ_USER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ UserID: userID }),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      householdID = data.HouseholdID;
      if (householdID) {
        tokens.householdID = householdID;
        sessionStorage.setItem("authTokens", JSON.stringify(tokens));
      } else {
        return null;
      }
    }

    return { householdID, userID, userName };
  } catch (e) {
    console.error("Error loading session data:", e);
    return null;
  }
};

// Helper to format datetime
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return date.toLocaleString("en-US", opts);
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
  const [currentUser, setCurrentUser] = useState<{
    userID: string;
    userName: string;
    email: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [householdUsers, setHouseholdUsers] = useState<HouseholdUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [newReservation, setNewReservation] = useState<Partial<Reservation>>({});

  // Custom-space handling
  const spaceOptions = ["Living Room", "Kitchen", "Dining Room", "Study", "Other"];
  const [useCustomSpace, setUseCustomSpace] = useState<boolean>(false);
  const [customSpaceName, setCustomSpaceName] = useState<string>("");

  // Load session on mount
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
          email: "",
        });
        setError(null);
      }
    })();
  }, [navigate]);

  // Fetch reservations
  const fetchReservations = async () => {
    if (!householdID) return;
    setLoading(true);
    try {
      const url = `${RESERVATIONS_BASE_URL}/reservations?HouseholdID=${encodeURIComponent(
        householdID
      )}`;
      const resp = await fetch(url);
      const { reservations: all = [] } = await resp.json();
      const now = new Date();
      const active = all.filter((r: Reservation) => new Date(r.EndTime) > now);
      setReservations(active);
    } catch (e) {
      console.error(e);
      setError("Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchHouseholdUsers = async () => {
    if (!householdID) return;
    try {
      const url = `${USERS_BASE_URL}/household-users?HouseholdID=${encodeURIComponent(
        householdID
      )}`;
      const resp = await fetch(url);
      const { users = [] } = await resp.json();
      setHouseholdUsers(users);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (householdID) {
      fetchReservations();
      fetchHouseholdUsers();
    }
  }, [householdID]);

  // Delete
  const deleteReservation = async (id: string) => {
    if (!currentUser) return;
    const url = `${RESERVATIONS_BASE_URL}/reservations/${id}?HouseholdID=${encodeURIComponent(
      householdID
    )}&UserID=${encodeURIComponent(currentUser.userID)}`;
    try {
      await fetch(url, { method: "DELETE" });
      fetchReservations();
    } catch (e) {
      console.error(e);
    }
  };

  // Approve/Reject
  const handleApproval = async (id: string, action: "Approve" | "Reject") => {
    if (!currentUser) return;
    const url = `${RESERVATIONS_BASE_URL}/reservations/${id}/approve?HouseholdID=${encodeURIComponent(
      householdID
    )}`;
    try {
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Action: action, UserID: currentUser.userID }),
      });
      fetchReservations();
    } catch (e) {
      console.error(e);
    }
  };

  // Save new
  const saveReservation = async () => {
    if (
      !newReservation.SpaceName ||
      !newReservation.Purpose ||
      !newReservation.StartTime ||
      !newReservation.EndTime ||
      !currentUser
    ) {
      alert("Please fill all fields");
      return;
    }
    const payload = {
      HouseholdID: householdID,
      SpaceName: useCustomSpace ? customSpaceName.trim() : newReservation.SpaceName,
      ReservedBy: currentUser.userID,
      Purpose: newReservation.Purpose,
      StartTime: newReservation.StartTime,
      EndTime: newReservation.EndTime,
      ApprovalStatus: "Pending",
      Approvers: [] as string[],
    };
    try {
      const resp = await fetch(`${RESERVATIONS_BASE_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        setModalOpen(false);
        fetchReservations();
      } else {
        alert("Failed to save reservation");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving reservation");
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
                  setNewReservation({});
                  setUseCustomSpace(false);
                  setCustomSpaceName("");
                  setModalOpen(true);
                }}
              >
                Add Reservation
              </MDBBtn>
            </div>

            {loading && <p className="text-center">Loading...</p>}
            {error && <p className="text-danger text-center">{error}</p>}
            {!loading && reservations.length === 0 && (
              <p className="text-center text-muted">No reservations yet…</p>
            )}

            {reservations.map((res) => {
              const user = householdUsers.find((u) => u.UserID === res.ReservedBy);
              const name = user ? user.Name : res.ReservedBy;
              return (
                <MDBCard key={res.ReservationID} className="mb-3">
                  <MDBCardBody>
                    <h5>{res.SpaceName}</h5>
                    <p>
                      <strong>Reserved By:</strong> {name}
                    </p>
                    <p>
                      <strong>Purpose:</strong> {res.Purpose}
                    </p>
                    <p>
                      <strong>Start:</strong> {formatDateTime(res.StartTime)}
                    </p>
                    <p>
                      <strong>End:</strong> {formatDateTime(res.EndTime)}
                    </p>
                    <p>
                      <strong>Status:</strong> {res.ApprovalStatus || "Pending"}
                    </p>

                    {res.ApprovalStatus === "Pending" &&
                      currentUser?.userID !== res.ReservedBy && (
                        <>
                          <MDBBtn
                            color="success"
                            size="sm"
                            onClick={() => handleApproval(res.ReservationID, "Approve")}
                          >
                            Approve
                          </MDBBtn>{" "}
                          <MDBBtn
                            color="warning"
                            size="sm"
                            onClick={() => handleApproval(res.ReservationID, "Reject")}
                          >
                            Reject
                          </MDBBtn>
                        </>
                      )}

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
            })}
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      {/* **Use `open` & `setOpen` so the modal actually appears** */}
      <MDBModal open={modalOpen} setOpen={setModalOpen} tabIndex={-1}>
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>Add Reservation</MDBModalTitle>
              <MDBBtn
                className="btn-close"
                color="none"
                onClick={() => setModalOpen(false)}
              />
            </MDBModalHeader>
            <MDBModalBody>
              <div className="mb-3">
                <label className="form-label">Select Space</label>
                <select
                  className="form-select"
                  value={
                    useCustomSpace
                      ? "Other"
                      : newReservation.SpaceName || ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "Other") {
                      setUseCustomSpace(true);
                      setCustomSpaceName("");
                    } else {
                      setUseCustomSpace(false);
                      setNewReservation({
                        ...newReservation,
                        SpaceName: v,
                      });
                    }
                  }}
                >
                  <option value="">-- Select a Space --</option>
                  {spaceOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              {useCustomSpace && (
                <MDBInput
                  label="Custom Space Name"
                  value={customSpaceName}
                  onChange={(e) => setCustomSpaceName(e.target.value)}
                  className="mb-3"
                />
              )}
              <MDBInput
                label="Purpose"
                value={newReservation.Purpose || ""}
                onChange={(e) =>
                  setNewReservation({
                    ...newReservation,
                    Purpose: e.target.value,
                  })
                }
                className="mb-3"
              />
              <MDBInput
                label="Start Time"
                type="datetime-local"
                value={newReservation.StartTime || ""}
                onChange={(e) =>
                  setNewReservation({
                    ...newReservation,
                    StartTime: e.target.value,
                  })
                }
                className="mb-3"
              />
              <MDBInput
                label="End Time"
                type="datetime-local"
                value={newReservation.EndTime || ""}
                onChange={(e) =>
                  setNewReservation({
                    ...newReservation,
                    EndTime: e.target.value,
                  })
                }
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
