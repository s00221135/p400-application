import React, { useState, useEffect, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBInput,
  MDBCheckbox,
  MDBCardTitle,
  MDBIcon,
} from "mdb-react-ui-kit";

const API_BASE_URL = "https://ixbggm0iid.execute-api.eu-west-1.amazonaws.com/dev";
const READ_USER_URL = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

const fetchSessionData = async (): Promise<{ householdID: string | null; userName: string | null }> => {
  const tokensString = sessionStorage.getItem("authTokens");
  if (!tokensString) return { householdID: null, userName: null };
  try {
    const tokens = JSON.parse(tokensString);
    let householdID = tokens.householdID || null;
    let userName = tokens.Name || tokens.username || null;
    // If userName is still null or looks like an email address, try to fetch profile from read-user endpoint
    if (!userName || userName.includes("@")) {
      const { userID, accessToken } = tokens;
      if (userID && accessToken) {
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
          userName = data.Name || userName;
          if (!householdID && data.HouseholdID) {
            householdID = data.HouseholdID;
          }
          // Save updated info back to sessionStorage
          tokens.Name = userName;
          if (householdID) tokens.householdID = householdID;
          sessionStorage.setItem("authTokens", JSON.stringify(tokens));
        }
      }
    }
    return { householdID, userName: userName || "Unknown" };
  } catch (error) {
    console.error("Error fetching session data:", error);
    return { householdID: null, userName: null };
  }
};

interface Product {
  ProductID: string;
  Name: string;
  Purchased: boolean;
  addedBy?: string;
}

interface ShoppingList {
  ListID: string;
  HouseholdID: string;
  Title: string;
  Products: Product[];
}

const ShoppingListDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Shopping list ID from URL
  const navigate = useNavigate();
  const [householdID, setHouseholdID] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState<string>("");

  useEffect(() => {
    async function loadSession() {
      const { householdID, userName } = await fetchSessionData();
      if (!householdID) {
        setError("Household ID not found. Please log in.");
      } else {
        setHouseholdID(householdID);
        setUserName(userName);
      }
    }
    loadSession();
  }, []);

  const fetchShoppingList = async () => {
    if (!householdID || !id) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/shopping-lists/${id}?HouseholdID=${encodeURIComponent(householdID)}`
      );
      if (response.ok) {
        const data = await response.json();
        setShoppingList(data);
      } else {
        const errData = await response.json();
        setError(errData.message || "Failed to fetch shopping list.");
      }
    } catch (err: any) {
      setError(err.message || "Error fetching shopping list.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (householdID && id) {
      fetchShoppingList();
    }
  }, [householdID, id]);

  // Toggle the purchased status of a product then update server
  const togglePurchased = (productId: string) => {
    if (!shoppingList) return;
    const updatedProducts = shoppingList.Products.map((prod) =>
      prod.ProductID === productId
        ? { ...prod, Purchased: !prod.Purchased }
        : prod
    );
    updateShoppingListOnServer({ ...shoppingList, Products: updatedProducts });
  };

  // Add new item (with addedBy set to userName) then update server
  const addNewItem = () => {
    if (!newItemName.trim() || !shoppingList) return;
    const newProduct: Product = {
      ProductID: Date.now().toString(),
      Name: newItemName,
      Purchased: false,
      addedBy: userName || "Unknown",
    };
    const updatedProducts = [...shoppingList.Products, newProduct];
    updateShoppingListOnServer({ ...shoppingList, Products: updatedProducts });
    setNewItemName("");
  };

  // Delete a product then update server
  const deleteProduct = (productId: string) => {
    if (!shoppingList) return;
    const updatedProducts = shoppingList.Products.filter(
      (prod) => prod.ProductID !== productId
    );
    updateShoppingListOnServer({ ...shoppingList, Products: updatedProducts });
  };

  // Update shopping list on server via PUT
  const updateShoppingListOnServer = async (updatedList: ShoppingList) => {
    if (!householdID) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/shopping-lists/${updatedList.ListID}?HouseholdID=${encodeURIComponent(householdID)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedList),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setShoppingList(data);
      } else {
        const errData = await response.json();
        alert("Failed to update list: " + (errData.message || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error updating list: " + (err.message || "Unknown error"));
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <MDBContainer className="mt-5 text-center">
          <MDBIcon fas icon="spinner" spin size="3x" />
          <p className="mt-3">Loading shopping list...</p>
        </MDBContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <MDBContainer className="mt-5 text-center">
          <p className="text-danger">{error}</p>
          <MDBBtn color="primary" onClick={() => navigate("/shopping-list")}>
            Back to Lists
          </MDBBtn>
        </MDBContainer>
      </>
    );
  }

  if (!shoppingList) {
    return null;
  }

  return (
    <>
      <Navigation />
      <MDBContainer className="mt-5">
        <MDBBtn color="secondary" onClick={() => navigate("/shopping-list")}>
          &larr; Back to Lists
        </MDBBtn>
        <MDBRow className="mt-3">
          <MDBCol>
            <MDBCard className="p-3 shadow-sm">
              <MDBCardTitle className="mb-3">{shoppingList.Title}</MDBCardTitle>
              <MDBRow className="mb-4">
                {shoppingList.Products.length === 0 ? (
                  <p>No items added yet.</p>
                ) : (
                  shoppingList.Products.map((item) => (
                    <MDBCol md="12" key={item.ProductID} className="mb-2">
                      <MDBCard className="p-2">
                        <MDBCardBody className="d-flex justify-content-between align-items-center">
                          <div>
                            <MDBCheckbox
                              id={`item-${item.ProductID}`}
                              checked={item.Purchased}
                              onChange={() => togglePurchased(item.ProductID)}
                              label={item.Name}
                            />
                            {item.addedBy && (
                              <p style={{ color: "grey", fontSize: "0.8em", margin: 0 }}>
                                Added by: {item.addedBy}
                              </p>
                            )}
                          </div>
                          <MDBBtn
                            color="danger"
                            size="sm"
                            onClick={() => deleteProduct(item.ProductID)}
                          >
                            <MDBIcon fas icon="trash" />
                          </MDBBtn>
                        </MDBCardBody>
                      </MDBCard>
                    </MDBCol>
                  ))
                )}
              </MDBRow>
              <MDBRow className="align-items-center">
                <MDBCol md="8">
                  <MDBInput
                    label="Add New Item"
                    value={newItemName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItemName(e.target.value)}
                  />
                </MDBCol>
                <MDBCol md="4">
                  <MDBBtn color="primary" onClick={addNewItem} className="w-100">
                    Add Item
                  </MDBBtn>
                </MDBCol>
              </MDBRow>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default ShoppingListDetail;
