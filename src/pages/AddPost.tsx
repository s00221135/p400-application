import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBInput,
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

const API_BASE_URL = "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev";

const tagOptions = ["Event", "Help Needed", "Social", "College", "Miscellaneous"];
const geofenceOptions = [100, 500, 1000]; // Radius options in meters

const AddPost: React.FC = () => {
  const [postContent, setPostContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(500); // Default 500m
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const userId = "12345-abcde"; // Replace with actual user ID from authentication

  const handleSubmit = async () => {
    if (!postContent.trim()) {
      setErrorMessage("Post content cannot be empty.");
      return;
    }

    if (!latitude || !longitude) {
      setErrorMessage("Please set a geofence location before posting.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const newPost = {
      UserID: userId,
      Content: postContent,
      Tags: selectedTags,
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

  const handleConfigureLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        console.log("✅ Geofence set at:", position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("⚠️ Location access denied:", error);
        setErrorMessage("⚠️ Location access denied. Cannot configure geofence.");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <MDBContainer className="mt-4">
      {/* ✅ Back Button */}
      <MDBBtn color="light" onClick={() => navigate(-1)} className="mb-3">
        <MDBIcon fas icon="arrow-left" /> Back
      </MDBBtn>

      <MDBCard>
        <MDBCardBody>
          <MDBCardTitle>Create a Post</MDBCardTitle>
          <MDBCardText>What's on your mind?</MDBCardText>

          <MDBInput
            type="textarea"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="mb-3"
            disabled={loading}
          />

          {/* ✅ Select Geofence Radius */}
          <MDBDropdown group className="mb-3">
            <MDBDropdownToggle color="info">
              Visibility: {geofenceRadius}m
            </MDBDropdownToggle>
            <MDBDropdownMenu>
              {geofenceOptions.map((radius) => (
                <MDBDropdownItem key={radius} onClick={() => setGeofenceRadius(radius)}>
                  {radius}m
                </MDBDropdownItem>
              ))}
            </MDBDropdownMenu>
          </MDBDropdown>

          <MDBBtn color="info" onClick={handleConfigureLocation} className="mb-2">
            Configure Location
          </MDBBtn>

          {errorMessage && <p className="text-danger">{errorMessage}</p>}

          <MDBBtn color="primary" className="mt-3" onClick={handleSubmit} disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </MDBBtn>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
};

export default AddPost;
