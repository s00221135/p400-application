import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardText,
  MDBCardTitle,
  MDBBtn,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownMenu,
  MDBDropdownItem,
  MDBIcon,
} from "mdb-react-ui-kit";
import Navigation from "../components/Navigation";

const API_BASE_URL = "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev";
const geofenceOptions = [100, 500, 1000]; // Radius options in meters

interface Post {
  PostID: string;
  Content: string;
  UserName: string;
  CreatedAt: string;
  Likes: number;
  Tags: string[];
  GeofenceRadius: number;
  Latitude: number;
  Longitude: number;
}

const SocialFeed: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(500); // Default radius
  const [error, setError] = useState<string | null>(null);

  // Request User Location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // ✅ Request User Location
  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        console.log("✅ Location granted:", lat, lon);
        fetchPosts(lat, lon, selectedRadius);
      },
      (locationError) => {
        console.warn("⚠️ Location access denied:", locationError);
        setError("⚠️ Location access denied. Cannot filter posts by proximity.");
        // If user denies permission, still fetch all posts (no lat/lon)
        fetchPosts(null, null, selectedRadius);
      },
      { enableHighAccuracy: true }
    );
  };

  // ✅ Fetch Posts Based on user location & radius
  const fetchPosts = async (
    lat: number | null,
    lon: number | null,
    radius: number
  ) => {
    try {
      let url = `${API_BASE_URL}/get-posts?radius=${radius}`;
      if (lat !== null && lon !== null) {
        url += `&latitude=${lat}&longitude=${lon}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (fetchError) {
      console.error("🚨 Error fetching posts:", fetchError);
      setError("Failed to load posts.");
    }
  };

  // ✅ Handle Likes
  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/like-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId }),
      });

      if (response.ok) {
        // Re-fetch posts to get updated like count
        fetchPosts(latitude, longitude, selectedRadius);
      } else {
        console.error("🚨 Error updating likes:", await response.text());
      }
    } catch (likeError) {
      console.error("🚨 Error liking post:", likeError);
    }
  };

  // ✅ Handle Radius Selection
  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    if (latitude !== null && longitude !== null) {
      fetchPosts(latitude, longitude, radius);
    } else {
      // If user denied location, just fetch all with the new radius
      fetchPosts(null, null, radius);
    }
  };

  return (
    <>
      {/* Top Navigation (Navbar) */}
      <Navigation />

      {/* Container for the entire page content */}
      <MDBContainer fluid className="py-4 px-3">
        {/* Action buttons row (mobile-first) */}
        <MDBRow className="g-3 mb-3" style={{ marginTop: "56px" }}>
          {/* 'Back' button */}
          <MDBCol xs="12" sm="4" md="4">
            <MDBBtn color="light" block onClick={() => navigate(-1)}>
              <MDBIcon fas icon="arrow-left" className="me-2" />
              Back
            </MDBBtn>
          </MDBCol>

          {/* Radius dropdown */}
          <MDBCol xs="12" sm="4" md="4">
            <MDBDropdown group className="w-100">
              <MDBDropdownToggle color="info" className="w-100 text-truncate">
                Viewing Posts in {selectedRadius}m Radius
              </MDBDropdownToggle>
              <MDBDropdownMenu>
                {geofenceOptions.map((radius) => (
                  <MDBDropdownItem
                    key={radius}
                    onClick={() => handleRadiusChange(radius)}
                  >
                    {radius}m
                  </MDBDropdownItem>
                ))}
              </MDBDropdownMenu>
            </MDBDropdown>
          </MDBCol>

          {/* Create Post button */}
          <MDBCol xs="12" sm="4" md="4">
            <MDBBtn
              color="primary"
              block
              onClick={() => navigate("/add-post")}
            >
              <MDBIcon fas icon="plus" className="me-2" />
              Create Post
            </MDBBtn>
          </MDBCol>
        </MDBRow>

        {/* Error / Retry location */}
        {error && (
          <MDBRow className="mb-3">
            <MDBCol>
              <div className="text-danger mb-2">{error}</div>
              <MDBBtn color="info" onClick={requestLocation}>
                Retry Location Access
              </MDBBtn>
            </MDBCol>
          </MDBRow>
        )}

        {/* Post feed */}
        <MDBRow className="justify-content-center">
          <MDBCol xs="12" md="8">
            {posts.length === 0 && !error ? (
              <p className="text-center text-muted">
                No posts found in your area.
              </p>
            ) : (
              posts.map((post) => (
                <MDBCard
                key={post.PostID}
                className="mb-3"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/view-post/${post.PostID}`)}
              >
                <MDBCardBody>
                  <MDBCardTitle>{post.UserName}</MDBCardTitle>
                  <MDBCardText>{post.Content}</MDBCardText>
                  <MDBCardText>
                    <small>📍 Visible within {post.GeofenceRadius}m</small>
                  </MDBCardText>
              
                  {/* Improved Like Button */}
                  <MDBBtn
                    outline
                    color="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleLike(post.PostID);
                    }}
                  >
                    <MDBIcon fas icon="heart" className="me-1" />
                    {post.Likes}
                  </MDBBtn>
                </MDBCardBody>
              </MDBCard>
              
              ))
            )}
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default SocialFeed;
