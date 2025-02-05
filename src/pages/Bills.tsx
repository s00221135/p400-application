// BillSplittingPage.tsx
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
  MDBInput
} from "mdb-react-ui-kit";

// API endpoints
const API_BASE_URL = "https://aq06k0y8e1.execute-api.eu-west-1.amazonaws.com/dev"; // Bills API
const USERS_BASE_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev"; // Household Users API

const HOUSEHOLD_ID = "house-001";

// Helper function to get the current user from sessionStorage.
const getCurrentUserFromSession = (): string | null => {
  const tokensString = sessionStorage.getItem("authTokens");
  if (tokensString) {
    try {
      const tokens = JSON.parse(tokensString);
      return tokens.userID; // Adjust based on your token structure.
    } catch (error) {
      console.error("Error parsing auth tokens:", error);
    }
  }
  return null;
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
}

interface HouseholdUser {
  UserID: string;
  Name: string;
  Email?: string;
}

const BillSplittingPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [householdUsers, setHouseholdUsers] = useState<HouseholdUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal and edit state.
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  
  // State for new bill (for both add and edit)
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
    Members: []
  });
  
  // State for the current logged-in user.
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  useEffect(() => {
    setCurrentUser(getCurrentUserFromSession());
  }, []);
  
  // Whenever currentBill changes (in edit mode), update the newBill state.
  useEffect(() => {
    if (editMode && currentBill) {
      // Here we assume your backend always stores a Members array.
      const members = currentBill.Members || [];
      console.log("Editing members:", members);
      setNewBill({
        Title: currentBill.Title,
        Description: currentBill.Description,
        TotalAmount: currentBill.TotalAmount,
        DueBy: currentBill.DueBy || "",
        Members: members
      });
    }
  }, [currentBill, editMode]);
  
  // Fetch bills from the API.
  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bills?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`
      );
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
  
  // Fetch household users.
  const fetchHouseholdUsers = async () => {
    try {
      const response = await fetch(
        `${USERS_BASE_URL}/household-users?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`
      );
      if (!response.ok) throw new Error("Failed to fetch household users");
      const data = await response.json();
      if (Array.isArray(data.users)) {
        setHouseholdUsers(data.users);
      } else {
        console.warn("No 'users' array found in response.");
      }
    } catch (err: unknown) {
      console.error("Error fetching household users:", err);
    }
  };
  
  useEffect(() => {
    fetchBills();
    fetchHouseholdUsers();
  }, []);
  
  // Handler for member checkbox changes in the modal.
  const handleMemberCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setNewBill(prev => ({ ...prev, Members: [...prev.Members, value] }));
    } else {
      setNewBill(prev => ({
        ...prev,
        Members: prev.Members.filter(member => member !== value)
      }));
    }
  };
  
  // Save (add or update) a bill.
  const saveBill = async () => {
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
    const payload = {
      HouseholdID: HOUSEHOLD_ID,
      Title: newBill.Title,
      Description: newBill.Description,
      TotalAmount: newBill.TotalAmount,
      DueBy: newBill.DueBy,
      Members: newBill.Members
    };
    console.log("Save payload:", payload);
  
    try {
      let response;
      if (editMode && currentBill) {
        response = await fetch(
          `${API_BASE_URL}/bills/${currentBill.BillID}?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/bills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      if (response.ok) {
        setNewBill({ Title: "", Description: "", TotalAmount: "", DueBy: "", Members: [] });
        setModalOpen(false);
        setEditMode(false);
        setCurrentBill(null);
        fetchBills();
      } else {
        const errData = await response.json();
        alert("Failed to save bill: " + (errData.message || "Unknown error"));
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert("Error saving bill: " + err.message);
      else alert("Unknown error saving bill");
    }
  };
  
  // Open modal for editing a bill.
  const editBill = (bill: Bill) => {
    setEditMode(true);
    setCurrentBill(bill);
    // Use the stored Members array; if missing, use an empty array.
    const members = bill.Members || [];
    console.log("Editing members:", members);
    setNewBill({
      Title: bill.Title,
      Description: bill.Description,
      TotalAmount: bill.TotalAmount,
      DueBy: bill.DueBy || "",
      Members: members
    });
    setModalOpen(true);
  };
  
  // Delete a bill.
  const deleteBill = async (bill: Bill) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/bills/${bill.BillID}?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        fetchBills();
      } else {
        alert("Failed to delete bill.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert("Error deleting bill: " + err.message);
      else alert("Unknown error deleting bill");
    }
  };
  
  // Update the current user's paid status by updating the PaidMembers array.
  const updatePaidStatus = async (bill: Bill, newStatus: boolean) => {
    if (!currentUser) {
      alert("User not logged in.");
      return;
    }
    const currentPaid = bill.PaidMembers || [];
    let updatedPaidMembers: string[];
    if (newStatus) {
      updatedPaidMembers = currentPaid.includes(currentUser)
        ? currentPaid
        : [...currentPaid, currentUser];
    } else {
      updatedPaidMembers = currentPaid.filter(uid => uid !== currentUser);
    }
    const payload = {
      HouseholdID: HOUSEHOLD_ID,
      Title: bill.Title,
      Description: bill.Description,
      TotalAmount: bill.TotalAmount,
      DueBy: bill.DueBy || "",
      Splits: bill.Splits, // leave splits unchanged
      Members: bill.Members || [],
      PaidMembers: updatedPaidMembers
    };
    try {
      const response = await fetch(
        `${API_BASE_URL}/bills/${bill.BillID}?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (response.ok) {
        fetchBills();
      } else {
        const errData = await response.json();
        alert("Failed to update payment status: " + (errData.message || "Unknown error"));
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert("Error updating payment status: " + err.message);
      else alert("Unknown error updating payment status");
    }
  };
  
  return (
    <>
      <Navigation />
      <MDBContainer style={{ marginTop: "2rem" }}>
        <h2>Bill Splitting</h2>
        <MDBRow>
          <MDBCol md="12" className="text-center mb-3">
            <MDBBtn
              color="primary"
              onClick={() => {
                setEditMode(false);
                setNewBill({ Title: "", Description: "", TotalAmount: "", DueBy: "", Members: [] });
                setModalOpen(true);
              }}
            >
              Add New Bill
            </MDBBtn>
          </MDBCol>
        </MDBRow>
  
        <MDBRow>
          <MDBCol md="12">
            <h4>Existing Bills</h4>
            {loading ? (
              <p>Loading bills...</p>
            ) : error ? (
              <p className="text-danger">{error}</p>
            ) : bills.length === 0 ? (
              <p>No bills available</p>
            ) : (
              bills.map((bill) => {
                const isPaidByCurrent = bill.PaidMembers ? bill.PaidMembers.includes(currentUser || "") : false;
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
                      {bill.Splits && (
                        <div>
                          <strong>Splits:</strong>
                          <ul>
                            {bill.Splits.map((split, idx) => {
                              const user = householdUsers.find(u => u.UserID === split.UserID);
                              const displayName = user ? user.Name : split.UserID;
                              const hasPaid = bill.PaidMembers
                                ? bill.PaidMembers.includes(split.UserID)
                                : split.Paid;
                              return (
                                <li key={idx}>
                                  {displayName}: {split.Share}{" "}
                                  <span style={{ fontSize: "1.2em", color: hasPaid ? "green" : "red" }}>
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
  
        {/* Modal for Adding/Editing a Bill */}
        <MDBModal open={modalOpen} setOpen={setModalOpen} tabIndex="-1">
          <MDBModalDialog>
            <MDBModalContent>
              <MDBModalHeader>
                <MDBModalTitle>{editMode ? "Edit Bill" : "Add New Bill"}</MDBModalTitle>
                <MDBBtn className="btn-close" color="none" onClick={() => setModalOpen(false)}></MDBBtn>
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
      </MDBContainer>
    </>
  );
};

export default BillSplittingPage;
