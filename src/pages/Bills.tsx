import React, { useState, useEffect, ChangeEvent } from "react";
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
  MDBInput,
} from "mdb-react-ui-kit";

// API endpoints
const API_BASE_URL = "https://aq06k0y8e1.execute-api.eu-west-1.amazonaws.com/dev"; // Bills API
const USERS_BASE_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev"; // Household Users API
const READ_USER_URL = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

// 1) Helper: load session data, fetch householdID if missing
const loadSessionData = async () => {
  const tokensString = sessionStorage.getItem("authTokens");
  if (!tokensString) return null;
  try {
    const tokens = JSON.parse(tokensString);

    // Check if we have everything we need
    if (!tokens.userID || !tokens.accessToken) {
      return null; // user not fully authenticated
    }

    // If householdID is missing, call read-user
    if (!tokens.householdID) {
      const resp = await fetch(READ_USER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ UserID: tokens.userID }),
      });

      if (!resp.ok) return null;
      const data = await resp.json();

      tokens.householdID = data.HouseholdID; // or whatever the field name is
      sessionStorage.setItem("authTokens", JSON.stringify(tokens));
    }

    return {
      userID: tokens.userID,
      householdID: tokens.householdID,
    };
  } catch (error) {
    console.error("Error loading session data:", error);
    return null;
  }
};

interface Split {
  UserID: string;
  Share: number;
  Paid: boolean;
}

interface Bill {
  BillID: string;
  Title: string;
  Description: string;
  TotalAmount: string;
  DueBy?: string;
  Splits?: Split[];
  Members?: string[];
  PaidMembers?: string[];
  ImageURL?: string;
}

interface HouseholdUser {
  UserID: string;
  Name: string;
  Email?: string;
}

// Extend file state to hold both file object and base64 string.
interface BillImage {
  file: File;
  base64: string;
}

const BillSplittingPage: React.FC = () => {
  const [householdID, setHouseholdID] = useState<string | null>(null);
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);

  const [bills, setBills] = useState<Bill[]>([]);
  const [householdUsers, setHouseholdUsers] = useState<HouseholdUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal and edit state.
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);

  // State for new bill.
  const [newBill, setNewBill] = useState<{
    Title: string;
    Description: string;
    TotalAmount: string;
    DueBy: string;
    Members: string[];
  }>({
    Title: "",
    Description: "",
    TotalAmount: "",
    DueBy: "",
    Members: [],
  });

  // State for image upload.
  const [billImage, setBillImage] = useState<BillImage | null>(null);

  // State for image modal.
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [currentImageURL, setCurrentImageURL] = useState<string>("");

  // 2) On mount, load session data and store userID/householdID
  useEffect(() => {
    (async () => {
      const session = await loadSessionData();
      if (!session) {
        setError("Could not determine household or user. Please log in.");
        return;
      }
      setHouseholdID(session.householdID);
      setCurrentUserID(session.userID);
    })();
  }, []);

  // 3) Fetch data only after we have the householdID
  useEffect(() => {
    if (householdID) {
      fetchBills(householdID);
      fetchHouseholdUsers(householdID);
    }
  }, [householdID]);

  // 4) If we go into edit mode, pre-fill
  useEffect(() => {
    if (editMode && currentBill) {
      const members = currentBill.Members || [];
      setNewBill({
        Title: currentBill.Title,
        Description: currentBill.Description,
        TotalAmount: currentBill.TotalAmount,
        DueBy: currentBill.DueBy || "",
        Members: members,
      });
    }
  }, [currentBill, editMode]);

  // ---- Data fetching logic ----

  const fetchBills = async (hid: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bills?HouseholdID=${encodeURIComponent(hid)}`);
      const data = await response.json();
      if (response.ok) {
        setBills(data.bills || []);
      } else {
        setError(data.message || "Failed to fetch bills.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Unknown error fetching bills");
    }
    setLoading(false);
  };

  const fetchHouseholdUsers = async (hid: string) => {
    try {
      const response = await fetch(
        `${USERS_BASE_URL}/household-users?HouseholdID=${encodeURIComponent(hid)}`
      );
      if (!response.ok) throw new Error("Failed to fetch household users");
      const data = await response.json();
      if (Array.isArray(data.users)) {
        setHouseholdUsers(data.users);
      }
    } catch (err: unknown) {
      console.error("Error fetching household users:", err);
    }
  };

  // ---- Handlers ----

  const handleMemberCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setNewBill((prev) => ({ ...prev, Members: [...prev.Members, value] }));
    } else {
      setNewBill((prev) => ({
        ...prev,
        Members: prev.Members.filter((m) => m !== value),
      }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // remove prefix
        const base64Content = result.split(",")[1];
        setBillImage({ file, base64: base64Content });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveBill = async () => {
    if (!householdID) {
      alert("No household found. Please re-login.");
      return;
    }
    if (!newBill.Title.trim()) {
      alert("Title is required.");
      return;
    }
    if (!newBill.TotalAmount.trim()) {
      alert("Total Amount is required.");
      return;
    }
    if (!newBill.Members || newBill.Members.length === 0) {
      alert("Please select at least one member.");
      return;
    }

    let payload: any = {
      HouseholdID: householdID,
      Title: newBill.Title,
      Description: newBill.Description,
      TotalAmount: newBill.TotalAmount,
      DueBy: newBill.DueBy,
      Members: newBill.Members,
    };

    if (billImage) {
      payload.ImageData = billImage.base64;
      payload.ImageContentType = billImage.file.type;
    }

    try {
      let response;
      if (editMode && currentBill) {
        response = await fetch(
          `${API_BASE_URL}/bills/${currentBill.BillID}?HouseholdID=${encodeURIComponent(householdID)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/bills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        // reset
        setBillImage(null);
        setNewBill({ Title: "", Description: "", TotalAmount: "", DueBy: "", Members: [] });
        setModalOpen(false);
        setEditMode(false);
        setCurrentBill(null);
        fetchBills(householdID);
      } else {
        const errData = await response.json();
        alert("Failed to save bill: " + (errData.message || "Unknown error"));
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert("Error saving bill: " + err.message);
      else alert("Unknown error saving bill");
    }
  };

  const editBill = (bill: Bill) => {
    setEditMode(true);
    setCurrentBill(bill);
    setModalOpen(true);
  };

  const deleteBill = async (bill: Bill) => {
    if (!householdID) {
      alert("No household found. Please re-login.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/bills/${bill.BillID}?HouseholdID=${encodeURIComponent(householdID)}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        fetchBills(householdID);
      } else {
        alert("Failed to delete bill.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert("Error deleting bill: " + err.message);
      else alert("Unknown error deleting bill");
    }
  };

  const updatePaidStatus = async (bill: Bill, newStatus: boolean) => {
    if (!currentUserID) {
      alert("User not logged in.");
      return;
    }
    if (!householdID) {
      alert("No household found. Please re-login.");
      return;
    }
    const currentPaid = bill.PaidMembers || [];
    let updatedPaidMembers: string[];

    if (newStatus) {
      updatedPaidMembers = currentPaid.includes(currentUserID)
        ? currentPaid
        : [...currentPaid, currentUserID];
    } else {
      updatedPaidMembers = currentPaid.filter((uid) => uid !== currentUserID);
    }

    const payload: any = {
      HouseholdID: householdID,
      Title: bill.Title,
      Description: bill.Description,
      TotalAmount: bill.TotalAmount,
      DueBy: bill.DueBy || "",
      Splits: bill.Splits,
      Members: bill.Members || [],
      PaidMembers: updatedPaidMembers,
    };

    // Keep the image if it exists
    if (bill.ImageURL) {
      payload.ImageURL = bill.ImageURL;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/bills/${bill.BillID}?HouseholdID=${encodeURIComponent(householdID)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        fetchBills(householdID);
      } else {
        const errData = await response.json();
        alert("Failed to update payment status: " + (errData.message || "Unknown error"));
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert("Error updating payment status: " + err.message);
      else alert("Unknown error updating payment status");
    }
  };

  const handleShowImage = (url: string) => {
    setCurrentImageURL(url);
    setShowImageModal(true);
  };

  return (
    <>
<Navigation />
<MDBContainer style={{ marginTop: "2rem" }}>
  {/* Centered Title */}
  <MDBRow className="justify-content-center">
    <MDBCol className="text-center">
      <h2 style={{ marginBottom: "1rem" }}>Bill Splitting</h2>
    </MDBCol>
  </MDBRow>
  {/* Extra space between title and Add Bill Button */}
  <MDBRow className="mt-4">
    <MDBCol md="12" className="text-center">
      <MDBBtn
        color="primary"
        onClick={() => {
          setEditMode(false);
          setNewBill({ Title: "", Description: "", TotalAmount: "", DueBy: "", Members: [] });
          setBillImage(null);
          setModalOpen(true);
        }}
      >
        Add New Bill
      </MDBBtn>
    </MDBCol>
  </MDBRow>
  {/* Extra space under Add New Bill Button */}
  <MDBRow className="mb-4"></MDBRow>

  {/* --- Existing Bills --- */}
        <MDBRow>
          <MDBCol md="12">
            {loading ? (
              <p>Loading bills...</p>
            ) : error ? (
              <p className="text-danger">{error}</p>
            ) : bills.length === 0 ? (
              <p>No bills available</p>
            ) : (
              bills.map((bill) => {
                const isPaidByCurrent = bill.PaidMembers
                  ? bill.PaidMembers.includes(currentUserID || "")
                  : false;
                return (
                  <MDBCard key={bill.BillID} className="mb-3">
                    <MDBCardBody>
                      <h5>{bill.Title}</h5>
                      <p>{bill.Description}</p>
                      <p>
                        <strong>Total Amount:</strong> {bill.TotalAmount}
                      </p>
                      {bill.DueBy && (
                        <p>
                          <strong>Due By:</strong> {bill.DueBy}
                        </p>
                      )}
                      {bill.ImageURL && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <MDBBtn
                            color="secondary"
                            size="sm"
                            onClick={() => handleShowImage(bill.ImageURL!)}
                          >
                            Show Bill
                          </MDBBtn>
                        </div>
                      )}
                      {bill.Splits && (
                        <div>
                          <strong>Splits:</strong>
                          <ul>
                            {bill.Splits.map((split, idx) => {
                              const user = householdUsers.find(
                                (u) => u.UserID === split.UserID
                              );
                              const displayName = user ? user.Name : split.UserID;
                              const hasPaid = bill.PaidMembers
                                ? bill.PaidMembers.includes(split.UserID)
                                : split.Paid;
                              return (
                                <li key={idx}>
                                  {displayName}: {split.Share}{" "}
                                  <span
                                    style={{
                                      fontSize: "1.2em",
                                      color: hasPaid ? "green" : "red",
                                    }}
                                  >
                                    {hasPaid ? "✔" : "✖"}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      <div style={{ marginTop: "1rem" }}>
                        <MDBBtn
                          color={isPaidByCurrent ? "warning" : "success"}
                          size="sm"
                          onClick={() => updatePaidStatus(bill, !isPaidByCurrent)}
                        >
                          {isPaidByCurrent ? "Unmark Payment" : "Mark as Paid"}
                        </MDBBtn>
                      </div>
                      <div style={{ marginTop: "1rem" }}>
                        <MDBBtn color="info" size="sm" onClick={() => editBill(bill)}>
                          Edit
                        </MDBBtn>{" "}
                        <MDBBtn color="danger" size="sm" onClick={() => deleteBill(bill)}>
                          Delete
                        </MDBBtn>
                      </div>
                    </MDBCardBody>
                  </MDBCard>
                );
              })
            )}
          </MDBCol>
        </MDBRow>

        {/* --- Add/Edit Bill Modal --- */}
        <MDBModal open={modalOpen} setOpen={setModalOpen} tabIndex="-1">
          <MDBModalDialog>
            <MDBModalContent>
              <MDBModalHeader>
                <MDBModalTitle>{editMode ? "Edit Bill" : "Add New Bill"}</MDBModalTitle>
                <MDBBtn
                  className="btn-close"
                  color="none"
                  onClick={() => setModalOpen(false)}
                ></MDBBtn>
              </MDBModalHeader>
              <MDBModalBody>
                <MDBInput
                  label="Title"
                  value={newBill.Title}
                  onChange={(e) => setNewBill({ ...newBill, Title: e.target.value })}
                  className="mb-3"
                />
                <MDBInput
                  label="Description"
                  value={newBill.Description}
                  onChange={(e) => setNewBill({ ...newBill, Description: e.target.value })}
                  className="mb-3"
                />
                <MDBInput
                  label="Total Amount"
                  type="number"
                  value={newBill.TotalAmount}
                  onChange={(e) => setNewBill({ ...newBill, TotalAmount: e.target.value })}
                  className="mb-3"
                />
                <MDBInput
                  label="Due By"
                  type="date"
                  value={newBill.DueBy}
                  onChange={(e) => setNewBill({ ...newBill, DueBy: e.target.value })}
                  className="mb-3"
                />
                {/* File upload input */}
                <div className="mb-3">
                  <label className="form-label">Upload Bill Image (optional)</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Members</label>
                  {householdUsers.map((user) => (
                    <div key={user.UserID} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`member-${user.UserID}`}
                        value={user.UserID}
                        checked={newBill.Members.includes(user.UserID)}
                        onChange={handleMemberCheckboxChange}
                      />
                      <label className="form-check-label" htmlFor={`member-${user.UserID}`}>
                        {user.Name}
                      </label>
                    </div>
                  ))}
                </div>
              </MDBModalBody>
              <MDBModalFooter>
                <MDBBtn color="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </MDBBtn>
                <MDBBtn color="primary" onClick={saveBill}>
                  {editMode ? "Update Bill" : "Save Bill"}
                </MDBBtn>
              </MDBModalFooter>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>

        {/* --- View Bill Image Modal --- */}
        <MDBModal open={showImageModal} setOpen={setShowImageModal} tabIndex="-1">
          <MDBModalDialog>
            <MDBModalContent>
              <MDBModalHeader>
                <MDBModalTitle>Bill Image</MDBModalTitle>
                <MDBBtn
                  className="btn-close"
                  color="none"
                  onClick={() => setShowImageModal(false)}
                ></MDBBtn>
              </MDBModalHeader>
              <MDBModalBody className="text-center">
                {currentImageURL ? (
                  <img
                    src={currentImageURL}
                    alt="Bill"
                    style={{ maxWidth: "100%", height: "auto", borderRadius: "10px" }}
                  />
                ) : (
                  <p>No image available</p>
                )}
              </MDBModalBody>
              <MDBModalFooter>
                <MDBBtn color="secondary" onClick={() => setShowImageModal(false)}>
                  Close
                </MDBBtn>
              </MDBModalFooter>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>
      </MDBContainer>
    </>
  );
};

export default BillSplittingPage;
