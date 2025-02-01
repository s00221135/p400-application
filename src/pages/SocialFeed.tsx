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
      (error) => {
        console.warn("⚠️ Location access denied:", error);
        setError("⚠️ Location access denied. Cannot filter posts by proximity.");
        fetchPosts(null, null, selectedRadius); // Fetch all posts if location is denied
      },
      { enableHighAccuracy: true }
    );
  };

  // ✅ Fetch Posts Based on User Location & Radius
  const fetchPosts = async (lat: number | null, lon: number | null, radius: number) => {
    try {
      let url = `${API_BASE_URL}/get-posts?radius=${radius}`;
      if (lat !== null && lon !== null) {
        url += `&latitude=${lat}&longitude=${lon}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("🚨 Error fetching posts:", error);
      setError("Failed to load posts.");
    }
  };

  // ✅ Handle Likes (Fetch updated like count from API)
  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/like-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId }),
      });

      if (response.ok) {
        fetchPosts(latitude, longitude, selectedRadius); // Re-fetch posts to get the updated count
      } else {
        console.error("🚨 Error updating likes:", await response.text());
      }
    } catch (error) {
      console.error("🚨 Error liking post:", error);
    }
  };

  // ✅ Handle Radius Selection
  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    if (latitude !== null && longitude !== null) {
      fetchPosts(latitude, longitude, radius);
    }
  };

  return (
    <>
      <Navigation />

      {/* ✅ Fixed Header for Buttons */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "#fff",
          zIndex: 1000,
          padding: "10px 15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #ccc",
          boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
          height: "60px",
        }}
      >
        <MDBBtn color="light" onClick={() => navigate(-1)}>
          <MDBIcon fas icon="arrow-left" /> Back
        </MDBBtn>

        <MDBDropdown group>
          <MDBDropdownToggle color="info">
            Viewing Posts in {selectedRadius}m Radius
          </MDBDropdownToggle>
          <MDBDropdownMenu>
            {geofenceOptions.map((radius) => (
              <MDBDropdownItem key={radius} onClick={() => handleRadiusChange(radius)}>
                {radius}m
              </MDBDropdownItem>
            ))}
          </MDBDropdownMenu>
        </MDBDropdown>

        <MDBBtn color="primary" onClick={() => navigate("/add-post")}>
          <MDBIcon fas icon="plus" /> Create Post
        </MDBBtn>
      </div>

      {/* ✅ Scrollable Post Feed (with padding to prevent overlap) */}
      <MDBContainer
        className="mt-5"
        style={{
          paddingTop: "80px", // Prevent content from being hidden under fixed header
          overflowY: "auto",
          height: "calc(100vh - 60px)", // Ensure it fills remaining height
        }}
      >
        <MDBRow className="justify-content-center">
          <MDBCol md="8">
            {error && (
              <>
                <p className="text-danger">{error}</p>
                <MDBBtn color="info" onClick={requestLocation}>
                  Retry Location Access
                </MDBBtn>
              </>
            )}

            {/* ✅ Posts Feed (Scrollable) */}
            <div style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
              {posts.length === 0 && !error ? (
                <p className="text-center text-muted">No posts found in your area.</p>
              ) : (
                posts.map((post) => (
                  <MDBCard
                    key={post.PostID}
                    className="mb-3"
                    onClick={() => navigate(`/view-post/${post.PostID}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <MDBCardBody>
                      <MDBCardTitle>{post.UserName}</MDBCardTitle>
                      <MDBCardText>{post.Content}</MDBCardText>
                      <MDBCardText>
                        <small>📍 Visible within {post.GeofenceRadius}m</small>
                      </MDBCardText>
                      <MDBBtn
                        color="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.PostID);
                        }}
                      >
                        ❤️ {post.Likes}
                      </MDBBtn>
                    </MDBCardBody>
                  </MDBCard>
                ))
              )}
            </div>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default SocialFeed;
