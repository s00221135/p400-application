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
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
} from "mdb-react-ui-kit";

const NOTICE_API_BASE_URL = "https://enyt5vj1nl.execute-api.eu-west-1.amazonaws.com/dev";
const READ_USER_URL = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

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

    if (!tokens.userID || !tokens.accessToken) {
      return { userName: null, householdID: null };
    }

    let householdID = tokens.householdID || null;
    let userName = tokens.Name || tokens.username || null;

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
        if (data.Name) {
          userName = data.Name;
        }
        if (!householdID && data.HouseholdID) {
          householdID = data.HouseholdID;
        }
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

interface Notice {
  NoticeID: string;
  Title?: string;
  Content?: string;
  CreatedBy?: string;  // we'll store the user's friendly name here
  CreatedAt?: string;
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatCreatedAt(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr; 

  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minuteStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${day}${suffix} ${month} ${year} ${hours}:${minuteStr}${ampm}`;
}

const NoticeBoardPage: React.FC = () => {
  const [householdID, setHouseholdID] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");

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

  // When we have a household load notices
  useEffect(() => {
    if (householdID) {
      fetchNotices(householdID);
    }
  }, [householdID]);

  const fetchNotices = async (hid: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${NOTICE_API_BASE_URL}/notices?HouseholdID=${encodeURIComponent(hid)}`
      );
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

  // Create Notice
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
      // Instead of storing userID storing userName for a friendly display
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
      setNewTitle("");
      setNewContent("");
      setModalOpen(false);
      fetchNotices(householdID);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create notice");
    }
  };

  // Delete
  const deleteNotice = async (nid: string) => {
    if (!householdID) {
      alert("No household ID found!");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this notice?")) {
      return;
    }
    try {
      const url = `${NOTICE_API_BASE_URL}/notices/${nid}?HouseholdID=${encodeURIComponent(
        householdID
      )}`;
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

  return (
    <>
      <Navigation />
      <MDBContainer className="mt-5">
        <MDBRow>
          <MDBCol>
            <h2 className="text-center">Household Notice Board</h2>
            <p className="text-center text-muted">
              Share quick updates with your housemates!
            </p>
          </MDBCol>
        </MDBRow>

        {error && <p className="text-danger text-center">{error}</p>}
        {loading && <p className="text-center text-muted">Loading notices...</p>}

        {/* Add Note Button */}
        <MDBRow className="mb-3">
          <MDBCol className="text-center">
            <MDBBtn color="primary" onClick={() => setModalOpen(true)}>
              Add Note
            </MDBBtn>
          </MDBCol>
        </MDBRow>

        {/* sticky note style */}
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
                  {(notice.CreatedBy || notice.CreatedAt) && (
                    <small className="text-muted">
                      Posted{" "}
                      {notice.CreatedBy ? `by ${notice.CreatedBy}` : "by unknown"}{" "}
                      {notice.CreatedAt
                        ? `at ${formatCreatedAt(notice.CreatedAt)}`
                        : ""}
                    </small>
                  )}
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          ))}
        </MDBRow>
      </MDBContainer>

      {/* Modal for adding a new note */}
      <MDBModal open={modalOpen} setOpen={setModalOpen} tabIndex="-1">
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>Add Note</MDBModalTitle>
              <MDBBtn className="btn-close" color="none" onClick={() => setModalOpen(false)}></MDBBtn>
            </MDBModalHeader>
            <MDBModalBody>
              <MDBInput
                label="Note Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mb-3"
              />
              <textarea
                className="form-control mb-3"
                placeholder="Note Content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
              ></textarea>
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </MDBBtn>
              <MDBBtn color="primary" onClick={addNotice}>
                Save Note
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
};

export default NoticeBoardPage;
