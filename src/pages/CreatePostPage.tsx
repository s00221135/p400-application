// src/pages/CreatePostPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownMenu,
  MDBDropdownItem,
  MDBIcon,
} from "mdb-react-ui-kit";
import TextareaAutosize from "react-textarea-autosize"; // Install via: npm install react-textarea-autosize
import CreatePostMap from "../components/CreatePostMap";

// Ensure your CSS with the auto-resizing rules is imported, e.g.:
// import "../App.css";

const API_BASE_URL =
  "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev"; // Replace with your actual endpoint
const geofenceOptions = [50, 100, 250, 500, 1000, 2000, 5000];

const formatRadius = (radius: number): string =>
  radius >= 1000 ? `${radius / 1000} km` : `${radius} m`;

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [postContent, setPostContent] = useState("");
  const [geofenceRadius, setGeofenceRadius] = useState<number>(500);

  // Location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dynamic userID from sessionStorage
  const getUserId = (): string | null => {
    const tokensString = sessionStorage.getItem("authTokens");
    if (tokensString) {
      try {
        const tokens = JSON.parse(tokensString);
        return tokens.userID || null;
      } catch (e) {
        console.error("Error parsing authTokens:", e);
        return null;
      }
    }
    return null;
  };

  // Get or refresh the user's location.
  const handleConfigureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          console.log(
            "✅ Location set at:",
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          console.warn("⚠️ Location access error:", error);
          setErrorMessage(
            "⚠️ Location access denied. Cannot configure geofence."
          );
        },
        { enableHighAccuracy: true }
      );
    } else {
      setErrorMessage("Geolocation is not supported by this browser.");
    }
  };

  // Automatically configure location on mount.
  useEffect(() => {
    handleConfigureLocation();
  }, []);

  // Handle form submission.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!postContent.trim()) {
      setErrorMessage("Post content cannot be empty.");
      return;
    }
    if (latitude === null || longitude === null) {
      setErrorMessage("Please set your geofence location before posting.");
      return;
    }

    const userID = getUserId();
    if (!userID) {
      setErrorMessage("User not authenticated.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const newPost = {
      UserID: userID,
      Content: postContent,
      Tags: [],
      Latitude: latitude,
      Longitude: longitude,
      GeofenceRadius: geofenceRadius,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/create-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("✅ Post created successfully!");
        navigate(`/view-post/${data.PostID}`);
      } else {
        setErrorMessage(data.message || "🚨 Failed to create post.");
      }
    } catch (error) {
      setErrorMessage("🚨 Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MDBContainer className="mt-5">
      {/* Back Button */}
      <MDBRow className="mb-3">
        <MDBCol className="text-start">
          <MDBBtn color="light" onClick={() => navigate("/social-feed")}>
            <MDBIcon fas icon="arrow-left" className="me-1" /> Back to Social Feed
          </MDBBtn>
        </MDBCol>
      </MDBRow>

      <MDBRow className="justify-content-center">
        <MDBCol md="10" lg="8">
          <h2 className="text-center mb-4">Create a New Post</h2>

          {/* Post Form Card */}
          <MDBCard className="mb-4 shadow-sm">
            <MDBCardBody className="p-4">
              <MDBCardTitle className="mb-3">What's on your mind?</MDBCardTitle>
              <form onSubmit={handleSubmit}>
                {/* Auto-resizing text area using react-textarea-autosize */}
                <TextareaAutosize
                  className="form-control mb-4 auto-resize-textarea"
                  placeholder="Share your thoughts"
                  value={postContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setPostContent(e.target.value)
                  }
                  disabled={loading}
                />

                {/* Flex container for Visibility dropdown & Post button, left-aligned */}
                <div
                  className="d-flex align-items-center gap-2 mb-4 w-100 justify-content-start"
                >
                  <MDBDropdown>
                    <MDBDropdownToggle color="info" type="button">
                      Visibility: {formatRadius(geofenceRadius)}
                    </MDBDropdownToggle>
                    <MDBDropdownMenu>
                      {geofenceOptions.map((radius) => (
                        <MDBDropdownItem
                          key={radius}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setGeofenceRadius(radius);
                          }}
                        >
                          {formatRadius(radius)}
                        </MDBDropdownItem>
                      ))}
                    </MDBDropdownMenu>
                  </MDBDropdown>

                  <MDBBtn type="submit" color="primary" disabled={loading}>
                    {loading ? "Posting..." : "Post"}
                  </MDBBtn>
                </div>

                {/* Row: Refresh Location */}
                <MDBRow className="mb-4 d-flex justify-content-center">
                  <MDBCol md="auto">
                    <MDBBtn color="info" onClick={handleConfigureLocation} type="button">
                      <MDBIcon fas icon="sync-alt" className="me-1" /> Refresh Location
                    </MDBBtn>
                  </MDBCol>
                </MDBRow>

                {errorMessage && (
                  <MDBRow>
                    <MDBCol className="text-center">
                      <p className="text-danger">{errorMessage}</p>
                    </MDBCol>
                  </MDBRow>
                )}
              </form>
            </MDBCardBody>
          </MDBCard>

          {/* Map Card */}
          <MDBCard className="mb-4 shadow-sm">
            <MDBCardBody className="p-4">
              <MDBCardTitle>Post Visibility Area</MDBCardTitle>
              <MDBCardText className="mb-3">
                This circle shows how far users can view your post.
              </MDBCardText>
              {latitude && longitude ? (
                <CreatePostMap
                  center={[longitude, latitude]}
                  radius={geofenceRadius}
                  height="400px"
                />
              ) : (
                <p className="text-center">Loading your location on the map...</p>
              )}
            </MDBCardBody>
          </MDBCard>

          {successMessage && (
            <MDBRow>
              <MDBCol className="text-center">
                <p className="text-success mt-3">{successMessage}</p>
              </MDBCol>
            </MDBRow>
          )}
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default CreatePostPage;
