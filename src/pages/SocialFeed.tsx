// src/pages/SocialFeed.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardText,
  MDBBtn,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownMenu,
  MDBDropdownItem,
  MDBIcon,
} from "mdb-react-ui-kit";
import Navigation from "../components/Navigation";

const API_BASE_URL = "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev";
// Predefined options for viewing radius (in meters)
const geofenceOptions = [
  { value: 100, label: "100 m" },
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
];

// Helper to format radius nicely.
const formatRadius = (radius: number): string =>
  radius >= 1000 ? `${radius / 1000} km` : `${radius} m`;

// Helper to get ordinal suffix for a number.
const getOrdinalSuffix = (n: number): string => {
  const j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

// Helper to format date/time as "1st March 2025, 3:04 PM"
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  return `${day}${suffix} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
};

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
  College?: string;
  AreaOfStudy?: string;
}

const SocialFeed: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(500);
  const [error, setError] = useState<string | null>(null);

  // Request the user's location on component mount.
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        console.log("✅ Location granted:", lat, lon);
        setError(null);
        fetchPosts(lat, lon, selectedRadius);
      },
      (locationError) => {
        console.warn("⚠️ Location access denied:", locationError);
        setError("⚠️ Location access denied. Cannot filter posts by proximity.");
        fetchPosts(null, null, selectedRadius);
      },
      { enableHighAccuracy: true }
    );
  }, [selectedRadius]); // Re-fetch posts if selectedRadius changes

  // Fetch posts from the API and sort them (most recent first).
  const fetchPosts = async (lat: number | null, lon: number | null, radius: number) => {
    try {
      let url = `${API_BASE_URL}/get-posts?radius=${radius}`;
      if (lat !== null && lon !== null) {
        // Use proper keys expected by your Lambda ("Latitude" and "Longitude").
        url += `&Latitude=${lat}&Longitude=${lon}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      let fetchedPosts: Post[] = data.posts || [];
      fetchedPosts.sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
      setPosts(fetchedPosts);
    } catch (fetchError) {
      console.error("🚨 Error fetching posts:", fetchError);
      setError("Failed to load posts.");
    }
  };

  // Handle liking a post.
  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/like-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId }),
      });
      if (response.ok) {
        fetchPosts(latitude, longitude, selectedRadius);
      } else {
        console.error("🚨 Error updating likes:", await response.text());
      }
    } catch (likeError) {
      console.error("🚨 Error liking post:", likeError);
    }
  };

  // Handle radius changes from the dropdown.
  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    fetchPosts(latitude, longitude, radius);
  };

  // Helper to render "Posted by" details.
  const renderPostedBy = (post: Post) => {
    const details: string[] = [];
    if (post.College && post.College.trim() !== "") {
      details.push(post.College);
    }
    if (post.AreaOfStudy && post.AreaOfStudy.trim() !== "") {
      details.push(post.AreaOfStudy);
    }
    return (
      <div style={{ fontSize: "0.9rem", lineHeight: "1.2" }}>
        <p className="mb-0">
          <small>Posted by {post.UserName}</small>
        </p>
        {details.length > 0 && (
          <p className="mb-0" style={{ fontSize: "0.8rem", color: "#6c757d" }}>
            <small>{details.join(" │ ")}</small>
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <Navigation />
      <MDBContainer fluid className="py-4 px-3">
        {/* Action Buttons */}
        <MDBRow className="g-3 mb-3">
          <MDBCol xs="12" sm="4">
          </MDBCol>
          <MDBCol xs="12" sm="4">
            <MDBDropdown group className="w-100">
              <MDBDropdownToggle color="info" className="w-100 text-truncate">
                Viewing Posts in {formatRadius(selectedRadius)}
              </MDBDropdownToggle>
              <MDBDropdownMenu>
                {geofenceOptions.map((option) => (
                  <MDBDropdownItem
                    key={option.value}
                    type="button"
                    onClick={() => handleRadiusChange(option.value)}
                  >
                    {option.label}
                  </MDBDropdownItem>
                ))}
              </MDBDropdownMenu>
            </MDBDropdown>
          </MDBCol>
          <MDBCol xs="12" sm="4">
            <MDBBtn color="primary" block onClick={() => navigate("/create-post")}>
              <MDBIcon fas icon="plus" className="me-2" /> Create Post
            </MDBBtn>
          </MDBCol>
        </MDBRow>

        {/* Request / Retry Location */}
        {latitude === null && longitude === null && (
          <MDBRow className="mb-3">
            <MDBCol className="text-center">
              <MDBBtn
                color="info"
                onClick={() =>
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const lat = position.coords.latitude;
                      const lon = position.coords.longitude;
                      setLatitude(lat);
                      setLongitude(lon);
                      fetchPosts(lat, lon, selectedRadius);
                    },
                    (err) => setError("Location access denied."),
                    { enableHighAccuracy: true }
                  )
                }
              >
                Allow Location Access
              </MDBBtn>
            </MDBCol>
          </MDBRow>
        )}

        {/* Display Error Message */}
        {error && (
          <MDBRow className="mb-3">
            <MDBCol>
              <div className="text-danger mb-2">{error}</div>
              <MDBBtn color="info" onClick={() => fetchPosts(latitude, longitude, selectedRadius)}>
                Retry Location Access
              </MDBBtn>
            </MDBCol>
          </MDBRow>
        )}

        {/* Post Feed */}
        <MDBRow className="justify-content-center">
          <MDBCol xs="12" md="8">
            {posts.length === 0 && !error ? (
              <p className="text-center text-muted">No posts found in your area.</p>
            ) : (
              posts.map((post) => (
                <MDBCard
                  key={post.PostID}
                  className="mb-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/view-post/${post.PostID}`)}
                >
                  <MDBCardBody>
                    {renderPostedBy(post)}
                    <MDBCardText className="mt-2">{post.Content}</MDBCardText>
                    <MDBCardText>
                      <small>{formatDateTime(post.CreatedAt)}</small>
                    </MDBCardText>
                    <MDBBtn
                      color="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.PostID);
                      }}
                      className="me-2"
                    >
                      <MDBIcon fas icon="heart" className="me-1" /> {post.Likes}
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
