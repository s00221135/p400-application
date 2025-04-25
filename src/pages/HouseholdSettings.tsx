// src/pages/HouseholdSettings.tsx
import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBSpinner,
  MDBIcon
} from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const READ_USER_URL = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";
const GET_HOUSEHOLD_INFO_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/join-household";
const LIST_USERS_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/household-users";
const MANAGE_HOUSEHOLD_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/household-users";
const REMOVE_USER_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/household-users";

// loadSessionData – retrieves userID and householdID from session storage

async function loadSessionData(): Promise<{
  userID: string;
  householdID: string;
  accessToken: string;
} | null> {
  const tokensString = sessionStorage.getItem("authTokens");
  if (!tokensString) return null;
  try {
    const tokens = JSON.parse(tokensString);
    const { userID, accessToken } = tokens;
    let { householdID } = tokens;
    if (!userID || !accessToken) return null;
    if (!householdID) {
      const resp = await fetch(READ_USER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ UserID: userID })
      });
      if (resp.ok) {
        const data = await resp.json();
        householdID = data.HouseholdID;
        tokens.householdID = householdID;
        sessionStorage.setItem("authTokens", JSON.stringify(tokens));
      }
    }
    return { userID, householdID: householdID || "", accessToken };
  } catch {
    return null;
  }
}

interface HouseholdUser {
  UserID: string;
  Name: string;
  Email?: string;
}

const HouseholdSettings: React.FC = () => {
  const navigate = useNavigate();

  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [householdID, setHouseholdID] = useState<string | null>(null);

  // Household info
  const [householdName, setHouseholdName] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");

  // Admin and member arrays
  const [admins, setAdmins] = useState<string[]>([]);
  const [members, setMembers] = useState<HouseholdUser[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // For renaming the household
  const [showRenameForm, setShowRenameForm] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const session = await loadSessionData();
      if (!session) {
        setError("No valid session found. Please log in.");
        setLoading(false);
        return;
      }
      if (!session.householdID) {
        setError("No household found for this user. Please join or create a space.");
        setLoading(false);
        return;
      }
      setCurrentUserID(session.userID);
      setHouseholdID(session.householdID);
      setLoading(false);
    })();
  }, []);

  // When householdID and userID are available fetches household info and users
  useEffect(() => {
    if (householdID && currentUserID) {
      fetchHouseholdInfo(householdID, currentUserID);
      fetchHouseholdUsers(householdID);
    }
  }, [householdID, currentUserID]);

  const fetchHouseholdInfo = async (hid: string, userID: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(GET_HOUSEHOLD_INFO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ HouseholdID: hid, UserID: userID })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || "Failed to fetch household info");
      }
      setHouseholdName(data.HouseholdName || "Unknown Household");
      setJoinCode(data.JoinCode || "----");
      if (Array.isArray(data.Admins)) {
        setAdmins(data.Admins);
        setIsAdmin(data.Admins.includes(userID));
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchHouseholdUsers = async (hid: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${LIST_USERS_URL}?HouseholdID=${encodeURIComponent(hid)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || "Failed to load household users");
      }
      if (Array.isArray(data.users)) {
        setMembers(data.users);
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const removeUser = async (targetUserID: string) => {
    if (!householdID || !currentUserID) return;
    if (!window.confirm("Are you sure you want to remove this user?")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(REMOVE_USER_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          HouseholdID: householdID,
          RequestingUserID: currentUserID,
          TargetUserID: targetUserID
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || "Failed to remove user");
      }
      // Refresh household info and users list
      fetchHouseholdInfo(householdID, currentUserID);
      fetchHouseholdUsers(householdID);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGrantAdmin = async (targetUserID: string) => {
    if (!householdID || !currentUserID) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(MANAGE_HOUSEHOLD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Action: "grant",
          HouseholdID: householdID,
          RequestingUserID: currentUserID,
          TargetUserID: targetUserID
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || "Failed to grant admin");
      }
      if (Array.isArray(data.Admins)) {
        setAdmins(data.Admins);
        setIsAdmin(data.Admins.includes(currentUserID));
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRevokeAdmin = async (targetUserID: string) => {
    if (!householdID || !currentUserID) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(MANAGE_HOUSEHOLD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Action: "revoke",
          HouseholdID: householdID,
          RequestingUserID: currentUserID,
          TargetUserID: targetUserID
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || "Failed to revoke admin");
      }
      if (Array.isArray(data.Admins)) {
        setAdmins(data.Admins);
        setIsAdmin(data.Admins.includes(currentUserID));
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRegenerateCode = async () => {
    if (!householdID || !currentUserID) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(MANAGE_HOUSEHOLD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Action: "regenerate",
          HouseholdID: householdID,
          RequestingUserID: currentUserID
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || "Failed to regenerate code");
      }
      if (data.NewJoinCode) {
        setJoinCode(data.NewJoinCode);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const renameHousehold = async () => {
    if (!householdID || !currentUserID || !newHouseholdName.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(MANAGE_HOUSEHOLD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Action: "rename",
          HouseholdID: householdID,
          RequestingUserID: currentUserID,
          NewName: newHouseholdName
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || "Failed to rename household");
      }
      setHouseholdName(data.NewName);
      setShowRenameForm(false);
      setNewHouseholdName("");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <Navigation />
      <MDBContainer className="mt-4">
        {/* Back Button */}
        <MDBBtn color="secondary" onClick={() => navigate(-1)} className="mb-3">
          <MDBIcon fas icon="arrow-left" className="me-1" />
          Back
        </MDBBtn>

        {loading && (
          <div className="text-center mb-4">
            <MDBSpinner color="primary" />
          </div>
        )}
        {error && <p className="text-danger">{error}</p>}

        <MDBRow className="justify-content-center">
          <MDBCol md="8">
            <MDBCard>
              <MDBCardBody>
                <h3>Household Settings</h3>
                <p>
                  <strong>Household Name:</strong> {householdName}
                </p>
                <p>
                  <strong>Join Code:</strong> {joinCode}
                </p>

                {isAdmin && (
                  <>
                    <MDBBtn color="warning" className="mb-3" onClick={handleRegenerateCode}>
                      <MDBIcon fas icon="redo" className="me-1" />
                      Regenerate Code
                    </MDBBtn>
                    
                    {!showRenameForm ? (
                      <MDBBtn color="info" className="mb-3 ms-2" onClick={() => setShowRenameForm(true)}>
                        <MDBIcon fas icon="edit" className="me-1" />
                        Rename Household
                      </MDBBtn>
                    ) : (
                      <div className="mb-3">
                        <label>New Household Name:</label>
                        <input
                          type="text"
                          className="form-control mb-2"
                          value={newHouseholdName}
                          onChange={(e) => setNewHouseholdName(e.target.value)}
                          style={{ maxWidth: "300px" }}
                        />
                        <MDBBtn color="success" size="sm" onClick={renameHousehold}>
                          Save
                        </MDBBtn>
                        <MDBBtn
                          color="secondary"
                          size="sm"
                          className="ms-2"
                          onClick={() => {
                            setShowRenameForm(false);
                            setNewHouseholdName("");
                          }}
                        >
                          Cancel
                        </MDBBtn>
                      </div>
                    )}
                  </>
                )}

                <hr />
                <h5>Members</h5>
                {members.length === 0 ? (
                  <p>No members found.</p>
                ) : (
                  members.map((user) => {
                    const isUserAdmin = admins.includes(user.UserID);
                    const isCurrentUser = user.UserID === currentUserID;
                    return (
                      <div
                        key={user.UserID}
                        className="d-flex justify-content-between align-items-center mb-2"
                      >
                        <div>
                          <strong>{user.Name || user.UserID}</strong>
                          {isUserAdmin && (
                            <span style={{ color: "green", marginLeft: 8 }}>
                              (Admin)
                            </span>
                          )}
                        </div>
                        {isAdmin && !isCurrentUser && (
                          <div>
                            {isUserAdmin ? (
                              <MDBBtn
                                size="sm"
                                color="info"
                                onClick={() => handleRevokeAdmin(user.UserID)}
                              >
                                Revoke Admin
                              </MDBBtn>
                            ) : (
                              <MDBBtn
                                size="sm"
                                color="info"
                                onClick={() => handleGrantAdmin(user.UserID)}
                              >
                                Grant Admin
                              </MDBBtn>
                            )}
                            <MDBBtn
                              size="sm"
                              color="danger"
                              className="ms-2"
                              onClick={() => removeUser(user.UserID)}
                            >
                              <MDBIcon fas icon="trash" />
                            </MDBBtn>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default HouseholdSettings;
