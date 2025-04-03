import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardHeader,
  MDBBtn,
  MDBInput,
  MDBIcon,
} from "mdb-react-ui-kit";

// Adjust to your real endpoints:
const NOTICE_API_BASE_URL = "https://enyt5vj1nl.execute-api.eu-west-1.amazonaws.com/dev"; 
const READ_USER_URL = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

// ----------- 1) fetchSessionData HELPER -----------
const fetchSessionData = async (): Promise<{
  userName: string | null;
  householdID: string | null;
}> => {
  const tokensString = sessionStorage.getItem("authTokens");
  if (!tokensString) {
    return { userName: null, householdID: null };
  }
  try {
    const tokens = JSON.parse(tokensString);

    // If we don't have a user ID or accessToken, can't do anything
    if (!tokens.userID || !tokens.accessToken) {
      return { userName: null, householdID: null };
    }

    let householdID = tokens.householdID || null;
    // Check if we have a real user name or if it's missing / an email / random code
    let userName = tokens.Name || tokens.username || null;

    // If name is missing or is an email/big code, try read-user to get the real name
    if (!userName || userName.includes("@") || userName.match(/[0-9a-f-]{8}-/i)) {
      const resp = await fetch(READ_USER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ UserID: tokens.userID }),
      });
      if (resp.ok) {
        const data = await resp.json();
        // Suppose 'data.Name' is the user's friendly name
        if (data.Name) {
          userName = data.Name;
        }
        // If householdID not in tokens yet, set it from user’s data
        if (!householdID && data.HouseholdID) {
          householdID = data.HouseholdID;
        }
        // Update session storage
        tokens.Name = userName;
        tokens.householdID = householdID;
        sessionStorage.setItem("authTokens", JSON.stringify(tokens));
      }
    }

    return {
      userName: userName || null,
      householdID,
    };
  } catch (error) {
    console.error("Error loading session data:", error);
    return { userName: null, householdID: null };
  }
};

// ---------- 2) NoticeBoardPage Component ----------
interface Notice {
  NoticeID: string;
  Title?: string;
  Content?: string;
  CreatedBy?: string;  // now we plan to store the user’s real name
  CreatedAt?: string;
}

const NoticeBoardPage: React.FC = () => {
  // State for household & name
  const [householdID, setHouseholdID] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Notices
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // For new notice
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");

  // On mount, fetch session data
  useEffect(() => {
    (async () => {
      const { userName, householdID } = await fetchSessionData();
      if (!householdID) {
        setError("No household found. Please log in.");
      } else {
        setUserName(userName);
        setHouseholdID(householdID);
      }
    })();
  }, []);

  // When we have a household, load notices
  useEffect(() => {
    if (householdID) {
      fetchNotices(householdID);
    }
  }, [householdID]);

  // ----------- 3) Fetch Notices -----------
  const fetchNotices = async (hid: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${NOTICE_API_BASE_URL}/notices?HouseholdID=${encodeURIComponent(hid)}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fetch notices");
      }
      const data = await response.json();
      setNotices(data.notices || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch notices");
    }
    setLoading(false);
  };

  // ----------- 4) Create Notice -----------
  const addNotice = async () => {
    if (!householdID) {
      alert("No household ID found!");
      return;
    }
    if (!newTitle.trim() && !newContent.trim()) {
      alert("Please enter a title or content.");
      return;
    }

    const payload = {
      HouseholdID: householdID,
      Title: newTitle.trim(),
      Content: newContent.trim(),
      // *** Instead of userID, store userName to get a friendly name
      CreatedBy: userName || "Anonymous",
    };

    try {
      const response = await fetch(`${NOTICE_API_BASE_URL}/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to create notice");
      }
      // Clear input fields
      setNewTitle("");
      setNewContent("");
      // Refresh the list
      fetchNotices(householdID);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create notice");
    }
  };

  // ----------- 5) Delete Notice -----------
  const deleteNotice = async (nid: string) => {
    if (!householdID) {
      alert("No household ID found!");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this notice?")) {
      return;
    }
    try {
      const url = `${NOTICE_API_BASE_URL}/notices/${nid}?HouseholdID=${encodeURIComponent(householdID)}`;
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to delete notice");
      }
      // Refresh
      fetchNotices(householdID);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete notice");
    }
  };

  // ----------- 6) Render UI -----------
  return (
    <>
      <Navigation />
      <MDBContainer className="mt-5">
        <MDBRow>
          <MDBCol>
            <h2>Household Notice Board</h2>
            <p className="text-muted">Share quick updates with your housemates!</p>
          </MDBCol>
        </MDBRow>

        {error && <p className="text-danger">{error}</p>}
        {loading && <p>Loading notices...</p>}

        {/* Form to add a new notice */}
        <MDBRow className="mb-3">
          <MDBCol md="6" className="mb-3">
            <MDBInput
              label="New Notice Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </MDBCol>
          <MDBCol md="6" className="mb-3">
            <MDBInput
              label="Notice Content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </MDBCol>
          <MDBCol md="12" className="text-center">
            <MDBBtn color="primary" onClick={addNotice}>
              Post Notice
            </MDBBtn>
          </MDBCol>
        </MDBRow>

        {/* Display existing notices in “sticky note” style */}
        <MDBRow>
          {notices.map((notice) => (
            <MDBCol key={notice.NoticeID} xs="12" sm="6" md="4" lg="3" className="mb-3">
              <MDBCard style={{ backgroundColor: "#fff9c4", minHeight: "150px" }}>
                <MDBCardHeader style={{ fontWeight: "bold" }}>
                  {notice.Title || "Untitled"}
                  <MDBIcon
                    icon="trash"
                    className="float-end text-danger"
                    style={{ cursor: "pointer" }}
                    onClick={() => deleteNotice(notice.NoticeID)}
                  />
                </MDBCardHeader>
                <MDBCardBody>
                  <p>{notice.Content}</p>

                  {/* If CreatedBy or CreatedAt, show them */}
                  {(notice.CreatedBy || notice.CreatedAt) && (
                    <small className="text-muted">
                      Posted
                      {notice.CreatedBy ? ` by ${notice.CreatedBy}` : " by unknown"} 
                      {notice.CreatedAt
                        ? ` at ${new Date(notice.CreatedAt).toLocaleString()}`
                        : ""}
                    </small>
                  )}
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          ))}
        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default NoticeBoardPage;
