import React, { useEffect, useState } from "react";
import Navigation from "../components/Navigation";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardTitle,
  MDBCardText,
  MDBBtn,
  MDBSpinner
} from "mdb-react-ui-kit";

const ENDPOINTS = {
  joinHousehold:  "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/join-household",
  readUser:       "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user",
  householdUsers: "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/household-users",
  notices:        "https://enyt5vj1nl.execute-api.eu-west-1.amazonaws.com/dev/notices",
  tasks:          "https://nlqi44a390.execute-api.eu-west-1.amazonaws.com/dev/tasks",
  reservations:   "https://ikq4o2e4c1.execute-api.eu-west-1.amazonaws.com/dev/reservations",
  bills:          "https://aq06k0y8e1.execute-api.eu-west-1.amazonaws.com/dev/bills"
};

// helper to get ordinal suffix on a day
const formatOrdinalDate = (d: Date): string => {
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "short" });
  const suffix =
    day % 10 === 1 && day !== 11 ? "st"
    : day % 10 === 2 && day !== 12 ? "nd"
    : day % 10 === 3 && day !== 13 ? "rd"
    : "th";
  return `${day}${suffix} ${month}`;
};

const Home: React.FC = () => {
  // session & auth
  const [userID, setUserID] = useState<string|null>(null);
  const [accessToken, setAccessToken] = useState<string|null>(null);
  const [householdID, setHouseholdID] = useState<string|null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // widget state + loaders
  const [householdName, setHouseholdName] = useState("Welcome!");
  const [loadingName, setLoadingName] = useState(true);

  const [dndStatus, setDndStatus] = useState("");
  const [loadingDnd, setLoadingDnd] = useState(true);

  const [noticeText, setNoticeText] = useState("");
  const [loadingNotice, setLoadingNotice] = useState(true);

  const [chosenChore, setChosenChore] = useState("");
  const [loadingChore, setLoadingChore] = useState(true);

  const [nextReservation, setNextReservation] = useState("");
  const [loadingResv, setLoadingResv] = useState(true);

  const [nextBill, setNextBill] = useState("");
  const [loadingBill, setLoadingBill] = useState(true);

  // 1) on mount, pull tokens + householdID
  useEffect(() => {
    const tok = sessionStorage.getItem("authTokens") || localStorage.getItem("authTokens");
    if (!tok) return;
    const p = JSON.parse(tok);
    setUserID(p.userID);
    setAccessToken(p.accessToken);
    const stored = localStorage.getItem("HouseholdID");
    if (stored) {
      setHouseholdID(stored);
    } else {
      // fetch householdID via read-user
      fetch(ENDPOINTS.readUser, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${p.accessToken}`
        },
        body: JSON.stringify({ UserID: p.userID })
      })
      .then(r => r.json())
      .then(d => {
        if (d.HouseholdID) {
          localStorage.setItem("HouseholdID", d.HouseholdID);
          setHouseholdID(d.HouseholdID);
        }
      })
      .catch(console.error);
    }
  }, []);

  // 2) once we have userID + householdID + token, fetch everything
  useEffect(() => {
    if (!userID || !householdID || !accessToken) return;

    const postJson = (url: string, body: any) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      }).then(r => r.json());

    // a) current user name
    postJson(ENDPOINTS.readUser, { UserID: userID })
      .then(d => { if (d.Name) setCurrentUserName(d.Name); })
      .catch(console.error);

    // b) household name
    postJson(ENDPOINTS.joinHousehold, { UserID: userID, HouseholdID: householdID })
      .then(d => { if (d.HouseholdName) setHouseholdName(d.HouseholdName); })
      .catch(console.error)
      .finally(() => setLoadingName(false));

    // c) DND for everyone
    fetch(`${ENDPOINTS.householdUsers}?HouseholdID=${householdID}`)
      .then(r => r.json())
      .then(async d => {
        const users: {UserID:string;Name:string}[] = d.users||[];
        const on = await Promise.all(
          users.map(u =>
            postJson(ENDPOINTS.readUser, {UserID:u.UserID})
              .then(res => res.DoNotDisturb ? u : null)
              .catch(() => null)
          )
        );
        const onUsers = on.filter((u): u is {UserID:string;Name:string} => !!u);
        if (onUsers.length) {
          const labels = onUsers.map(u => u.UserID===userID ? "You" : u.Name);
          const verb = labels.length>1 ? "have" : "has";
          setDndStatus(`${labels.join(" and ")} ${verb} DND on`);
        } else {
          setDndStatus("No one has Do Not Disturb on");
        }
      })
      .catch(() => setDndStatus("DND status unavailable"))
      .finally(() => setLoadingDnd(false));

    // d) latest notice
    fetch(`${ENDPOINTS.notices}?HouseholdID=${householdID}`)
      .then(r => r.json())
      .then(d => {
        const notes = d.notices||[];
        if (notes.length) {
          const latest = notes.sort((a:any,b:any)=>
            new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
          )[0];
          const by = latest.CreatedBy === currentUserName
            ? "You"
            : (latest.CreatedBy||"Someone");
          const at = new Date(latest.CreatedAt).toLocaleString("default", {
            day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"
          });
          setNoticeText(`${by} left a note at ${at}`);
        } else {
          setNoticeText("No notices yet");
        }
      })
      .catch(() => setNoticeText("Notice data unavailable"))
      .finally(() => setLoadingNotice(false));

    // e) upcoming chore (with ordinal date!)
    fetch(`${ENDPOINTS.tasks}?HouseholdID=${householdID}`)
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(d => {
        const tasks = Array.isArray(d.tasks) ? d.tasks : [];
        const mine = tasks.filter((t:any) =>
          t.AssignedTo === userID && !t.Completed
        );
        if (mine.length) {
          const dueDate = new Date(mine[0].DueDate);
          setChosenChore(
            `Your next chore: ${mine[0].Title}, due ${formatOrdinalDate(dueDate)}`
          );
        } else {
          setChosenChore("No chores pending");
        }
      })
      .catch(() => setChosenChore("Chore data unavailable"))
      .finally(() => setLoadingChore(false));

    // f) next reservation
    fetch(`${ENDPOINTS.householdUsers}?HouseholdID=${householdID}`)
      .then(r => r.json())
      .then(({ users }) => {
        const m: Record<string,string> = {};
        (users||[]).forEach((u:any) => m[u.UserID] = u.Name);
        return fetch(`${ENDPOINTS.reservations}?HouseholdID=${householdID}`)
          .then(r => r.json())
          .then(({ reservations }) => {
            const up = (reservations||[])
              .filter((x:any) => new Date(x.StartTime) > new Date())
              .sort((a:any,b:any) =>
                new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime()
              );
            if (up.length) {
              const n = up[0];
              const who = n.ReservedBy === userID
                ? "You"
                : m[n.ReservedBy] || "Someone";
              const dateTime = new Date(n.StartTime).toLocaleString("default", {
                day:"numeric", month:"short", hour:"numeric", minute:"2-digit"
              });
              setNextReservation(
                `Upcoming: ${who} has ${n.SpaceName} reserved for ${dateTime}`
              );
            } else {
              setNextReservation("No upcoming reservations");
            }
          });
      })
      .catch(() => setNextReservation("Reservation data unavailable"))
      .finally(() => setLoadingResv(false));

    // g) next bill due
    fetch(`${ENDPOINTS.bills}?HouseholdID=${householdID}`)
      .then(async r => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        return Array.isArray(d.bills) ? d.bills : [];
      })
      .then(arr => {
        if (arr.length === 0) {
          setNextBill("No upcoming bills");
          return;
        }
        arr.sort((a,b) =>
          new Date(a.DueBy!).getTime() - new Date(b.DueBy!).getTime()
        );
        const b = arr[0];
        const due = new Date(b.DueBy!);
        setNextBill(`${b.Title} due on ${formatOrdinalDate(due)}`);
      })
      .catch(() => setNextBill("No upcoming bills"))
      .finally(() => setLoadingBill(false));

  }, [userID, householdID, accessToken, currentUserName]);

  return (
    <>
      <Navigation />
      <MDBContainer fluid className="p-4" style={{
        background: "linear-gradient(135deg, #FA6F61, #439A86)",
        minHeight: "calc(100vh - 56px)",
        paddingTop: "120px"
      }}>
        {/* Welcome */}
        <MDBRow className="mb-4">
          <MDBCol>
            <MDBCard className="p-4 text-center" style={{
              borderRadius: "10px",
              boxShadow: "0 0 20px rgba(0,0,0,0.1)",
              backgroundColor: "rgba(255,255,255,0.8)"
            }}>
              <MDBCardTitle style={{ fontSize: "2rem", fontWeight: "bold", color: "#333" }}>
                {loadingName
                  ? <><MDBSpinner size="sm" /> Loading…</>
                  : `Welcome to ${householdName}!`}
              </MDBCardTitle>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        {/* Widgets */}
        <MDBRow className="g-4">

          {/* Do Not Disturb */}
          <MDBCol md="4">
            <MDBCard className="p-3" style={{
              borderRadius: "10px",
              backgroundColor: "#439A86",
              color: "white",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)"
            }}>
              <MDBCardTitle style={{ fontSize: "1.5rem" }}>Do Not Disturb</MDBCardTitle>
              <MDBCardText tag="div">
                {loadingDnd ? <MDBSpinner size="sm"/> : dndStatus}
              </MDBCardText>
            </MDBCard>
          </MDBCol>

          {/* Reserved Spaces */}
          <MDBCol md="4">
            <MDBCard className="p-3" style={{
              borderRadius: "10px",
              backgroundColor: "#F29136",
              color: "white",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)"
            }}>
              <MDBCardTitle style={{ fontSize: "1.5rem" }}>Reserved Spaces</MDBCardTitle>
              <MDBCardText tag="div">
                {loadingResv ? <MDBSpinner size="sm"/> : nextReservation}
              </MDBCardText>
            </MDBCard>
          </MDBCol>

          {/* Upcoming Chores */}
          <MDBCol md="4">
            <MDBCard className="p-3" style={{
              borderRadius: "10px",
              backgroundColor: "#FA6F61",
              color: "white",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)"
            }}>
              <MDBCardTitle style={{ fontSize: "1.5rem" }}>Upcoming Chores</MDBCardTitle>
              <MDBCardText tag="div">
                {loadingChore ? <MDBSpinner size="sm"/> : chosenChore}
              </MDBCardText>
            </MDBCard>
          </MDBCol>

          {/* Bills */}
          <MDBCol md="6">
            <MDBCard className="p-3" style={{
              borderRadius: "10px",
              backgroundColor: "#FFF3E0",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)"
            }}>
              <MDBCardTitle style={{ fontSize: "1.5rem", color: "#333" }}>Bills</MDBCardTitle>
              <MDBCardText tag="div" style={{ color: "#555" }}>
                {loadingBill ? <MDBSpinner size="sm"/> : nextBill}
              </MDBCardText>
            </MDBCard>
          </MDBCol>

          {/* Notice Board */}
          <MDBCol md="4">
            <MDBCard className="p-3" style={{
              borderRadius: "10px",
              backgroundColor: "#FFECb3",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)"
            }}>
              <MDBCardTitle style={{ fontSize: "1.5rem", color: "#333" }}>Notice Board</MDBCardTitle>
              <MDBCardText tag="div" style={{ color: "#555" }}>
                {loadingNotice ? <MDBSpinner size="sm"/> : noticeText}
              </MDBCardText>
            </MDBCard>
          </MDBCol>

          {/* Social Feed */}
          <MDBCol md="6">
            <MDBCard className="p-3" style={{
              borderRadius: "10px",
              backgroundColor: "#ede7f6",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)"
            }}>
              <MDBCardTitle style={{ fontSize: "1.5rem", color: "#333" }}>Social Feed</MDBCardTitle>
              <MDBCardText style={{ color: "#555" }}>
                Catch up on the latest happenings, fun stories, and community updates!
              </MDBCardText>
              <MDBBtn color="dark" className="w-100" onClick={()=>window.location.href="/social-feed"}>
                Go to Social Feed
              </MDBBtn>
            </MDBCard>
          </MDBCol>

        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default Home;
