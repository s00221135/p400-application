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
  MDBInput,
  MDBIcon,
} from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://ixbggm0iid.execute-api.eu-west-1.amazonaws.com/dev";
const READ_USER_URL = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

const getHouseholdIdFromSession = (): string | null => {
  const tokensString = sessionStorage.getItem("authTokens");
  if (tokensString) {
    try {
      const tokens = JSON.parse(tokensString);
      return tokens.householdID || null;
    } catch (error) {
      console.error("Error parsing auth tokens:", error);
    }
  }
  return null;
};

const fetchHouseholdID = async (): Promise<string | null> => {
  const tokensString = sessionStorage.getItem("authTokens");
  if (!tokensString) return null;
  try {
    const tokens = JSON.parse(tokensString);
    if (tokens.householdID) {
      return tokens.householdID;
    }
    const { userID, accessToken } = tokens;
    if (!userID || !accessToken) return null;
    const response = await fetch(READ_USER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ UserID: userID })
    });
    if (response.ok) {
      const data = await response.json();
      const householdID = data.HouseholdID || null;
      if (householdID) {
        tokens.householdID = householdID;
        sessionStorage.setItem("authTokens", JSON.stringify(tokens));
      }
      return householdID;
    }
    return null;
  } catch (error) {
    console.error("Error fetching household ID:", error);
    return null;
  }
};

interface Product {
  ProductID: string;
  Name: string;
  Purchased: boolean;
}

interface ShoppingList {
  ListID: string;
  HouseholdID: string;
  Title: string;
  Products: Product[];
}

const ShoppingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [householdID, setHouseholdID] = useState<string | null>(null);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  
  const [newListTitle, setNewListTitle] = useState<string>("");
  const [newProduct, setNewProduct] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadHouseholdID() {
      let id = getHouseholdIdFromSession();
      if (!id) {
        id = await fetchHouseholdID();
      }
      if (!id) {
        setError("Household ID not found. Please log in.");
      } else {
        setHouseholdID(id);
      }
    }
    loadHouseholdID();
  }, []);

  const fetchShoppingLists = async () => {
    if (!householdID) {
      setError("Household ID not found. Please log in.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/shopping-lists?HouseholdID=${encodeURIComponent(householdID)}`
      );
      const data = await response.json();
      if (response.ok) {
        setShoppingLists(data.shoppingLists || []);
      } else {
        setError(data.message || "Failed to fetch shopping lists.");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error fetching shopping lists");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (householdID) {
      fetchShoppingLists();
    }
  }, [householdID]);

  const addProduct = () => {
    if (!newProduct.trim()) return;
    setProducts([...products, { ProductID: Date.now().toString(), Name: newProduct, Purchased: false }]);
    setNewProduct("");
  };

  const togglePurchased = (productId: string) => {
    setProducts(products.map(p => p.ProductID === productId ? { ...p, Purchased: !p.Purchased } : p));
  };

  const saveShoppingList = async () => {
    if (!householdID) {
      alert("Household ID not found. Please log in.");
      return;
    }
    if (!newListTitle.trim()) {
      alert("List title is required.");
      return;
    }
    const payload = {
      HouseholdID: householdID,
      Title: newListTitle,
      Products: products
    };

    try {
      let response;
      if (editMode && currentList) {
        response = await fetch(
          `${API_BASE_URL}/shopping-lists/${currentList.ListID}?HouseholdID=${encodeURIComponent(householdID)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/shopping-lists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      if (response.ok) {
        setNewListTitle("");
        setProducts([]);
        setModalOpen(false);
        setEditMode(false);
        setCurrentList(null);
        fetchShoppingLists();
      } else {
        const errData = await response.json();
        alert("Failed to save shopping list: " + (errData.message || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving shopping list: " + (err.message || "Unknown error"));
    }
  };

  const editShoppingList = (list: ShoppingList) => {
    setEditMode(true);
    setCurrentList(list);
    setNewListTitle(list.Title);
    setProducts(list.Products || []);
    setModalOpen(true);
  };

  const deleteShoppingList = async (list: ShoppingList) => {
    if (!householdID) {
      alert("Household ID not found. Please log in.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this shopping list?")) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/shopping-lists/${list.ListID}?HouseholdID=${encodeURIComponent(householdID)}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        fetchShoppingLists();
      } else {
        alert("Failed to delete shopping list.");
      }
    } catch (err: any) {
      alert("Error deleting shopping list: " + (err.message || "Unknown error"));
    }
  };

  return (
    <>
      <Navigation />
      <MDBContainer className="mt-5">
        <MDBRow className="mb-4">
          <MDBCol>
            <h2 className="mb-3">Household Shopping Lists</h2>
          </MDBCol>
        </MDBRow>
        <MDBRow className="mb-4">
          <MDBCol md="12" className="text-center">
            <MDBBtn
              color="primary"
              onClick={() => {
                setEditMode(false);
                setNewListTitle("");
                setProducts([]);
                setModalOpen(true);
              }}
            >
              <MDBIcon fas icon="plus" className="me-2" />
              Add New Shopping List
            </MDBBtn>
          </MDBCol>
        </MDBRow>
        <MDBRow>
          <MDBCol md="12">
            {loading ? (
              <p>Loading shopping lists...</p>
            ) : error ? (
              <p className="text-danger">{error}</p>
            ) : shoppingLists.length === 0 ? (
              <p>No shopping lists available.</p>
            ) : (
              shoppingLists.map((list) => (
                <MDBCard key={list.ListID} className="mb-3 shadow-sm">
                  <MDBCardBody>
                    <h5>{list.Title}</h5>
                    {list.Products && list.Products.length > 0 ? (
                      <ul>
                        {list.Products.map(product => (
                          <li key={product.ProductID}>
                            {product.Name}{" "}
                            <span
                              style={{ fontSize: "1.2em", color: product.Purchased ? "green" : "red", cursor: "pointer" }}
                              onClick={() => togglePurchased(product.ProductID)}
                            >
                              {product.Purchased ? "✔" : "✖"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No products added.</p>
                    )}
                    <div className="d-flex justify-content-end mt-3">
                      <MDBBtn color="info" size="sm" onClick={() => editShoppingList(list)}>
                        Edit
                      </MDBBtn>
                      <MDBBtn color="danger" size="sm" className="ms-2" onClick={() => deleteShoppingList(list)}>
                        Delete
                      </MDBBtn>
                      <MDBBtn color="secondary" size="sm" className="ms-2" onClick={() => navigate(`/shopping-list/${list.ListID}`)}>
                        View Detail
                      </MDBBtn>
                    </div>
                  </MDBCardBody>
                </MDBCard>
              ))
            )}
          </MDBCol>
        </MDBRow>
        {/* Modal for Adding/Editing a Shopping List */}
        <MDBModal open={modalOpen} setOpen={setModalOpen} tabIndex="-1">
          <MDBModalDialog>
            <MDBModalContent>
              <MDBModalHeader>
                <MDBModalTitle>{editMode ? "Edit Shopping List" : "Add New Shopping List"}</MDBModalTitle>
                <MDBBtn className="btn-close" color="none" onClick={() => setModalOpen(false)}></MDBBtn>
              </MDBModalHeader>
              <MDBModalBody>
                <MDBInput
                  label="List Title"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="mb-3"
                />
                <MDBInput
                  label="New Product"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="mb-3"
                />
                <MDBBtn color="secondary" onClick={addProduct}>
                  Add Product
                </MDBBtn>
                <hr />
                {products.length > 0 ? (
                  <ul>
                    {products.map(product => (
                      <li key={product.ProductID}>
                        {product.Name}{" "}
                        <span
                          style={{ fontSize: "1.2em", color: product.Purchased ? "green" : "red", cursor: "pointer" }}
                          onClick={() => togglePurchased(product.ProductID)}
                        >
                          {product.Purchased ? "✔" : "✖"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No products added yet.</p>
                )}
              </MDBModalBody>
              <MDBModalFooter>
                <MDBBtn color="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </MDBBtn>
                <MDBBtn color="primary" onClick={saveShoppingList}>
                  {editMode ? "Update List" : "Save List"}
                </MDBBtn>
              </MDBModalFooter>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>
      </MDBContainer>
    </>
  );
};

export default ShoppingListPage;
