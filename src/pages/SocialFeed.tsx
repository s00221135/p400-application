import React, { useState } from "react";
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
} from "mdb-react-ui-kit";
import Navigation from "../components/Navigation";

interface Post {
  postId: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  category: string;
  locationRange: number; // Simulating geofencing radius
}

const SocialFeed: React.FC = () => {
  const navigate = useNavigate(); 

  // Mock posts with location ranges
  const [posts, setPosts] = useState<Post[]>([
    {
      postId: "1",
      content: "Excited for the weekend! 🎉",
      author: "Alice",
      createdAt: new Date().toISOString(),
      likes: 5,
      category: "event",
      locationRange: 100, // This post is visible within 100m
    },
    {
      postId: "2",
      content: "Just moved into my new dorm! Anyone nearby?",
      author: "Bob",
      createdAt: new Date().toISOString(),
      likes: 3,
      category: "help needed",
      locationRange: 500, // This post is visible within 500m
    },
    {
      postId: "3",
      content: "Party at my place tonight!",
      author: "Charlie",
      createdAt: new Date().toISOString(),
      likes: 10,
      category: "event",
      locationRange: 1000, // This post is visible within 1km
    },
  ]);

  // User-selected filtering options
  const [selectedRadius, setSelectedRadius] = useState<number>(1000);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Function to handle liking a post
  const handleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.postId === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  return (
    <>
      <Navigation />

      <MDBContainer className="mt-5">
        <MDBRow className="justify-content-center">
          <MDBCol md="8">
            <h2 className="text-center">Social Feed</h2>

            {/* Create Post Button */}
            <div className="text-center mb-3">
              <MDBBtn color="primary" onClick={() => navigate("/add-post")}>
                Create Post
              </MDBBtn>
            </div>

            {/* Post Filtering */}
            <div className="d-flex justify-content-between mb-3">
              {/* Filter by Radius */}
              <MDBDropdown>
                <MDBDropdownToggle color="info">
                  Visibility: {selectedRadius}m
                </MDBDropdownToggle>
                <MDBDropdownMenu>
                  <MDBDropdownItem onClick={() => setSelectedRadius(100)}>
                    100m - Accommodation
                  </MDBDropdownItem>
                  <MDBDropdownItem onClick={() => setSelectedRadius(500)}>
                    500m - Local Area
                  </MDBDropdownItem>
                  <MDBDropdownItem onClick={() => setSelectedRadius(1000)}>
                    1km - Campus
                  </MDBDropdownItem>
                </MDBDropdownMenu>
              </MDBDropdown>

              {/* Filter by Category */}
              <MDBDropdown>
                <MDBDropdownToggle color="secondary">
                  {selectedCategory === "all" ? "All Posts" : selectedCategory}
                </MDBDropdownToggle>
                <MDBDropdownMenu>
                  <MDBDropdownItem onClick={() => setSelectedCategory("all")}>
                    All Posts
                  </MDBDropdownItem>
                  <MDBDropdownItem onClick={() => setSelectedCategory("event")}>
                    Events
                  </MDBDropdownItem>
                  <MDBDropdownItem onClick={() => setSelectedCategory("help needed")}>
                    Help Needed
                  </MDBDropdownItem>
                  <MDBDropdownItem onClick={() => setSelectedCategory("college")}>
                    College
                  </MDBDropdownItem>
                </MDBDropdownMenu>
              </MDBDropdown>
            </div>

            {/* Display filtered posts */}
            {posts
              .filter(
                (post) =>
                  post.locationRange <= selectedRadius &&
                  (selectedCategory === "all" || post.category === selectedCategory)
              )
              .map((post) => (
                <MDBCard key={post.postId} className="mb-3">
                  <MDBCardBody>
                    <MDBCardTitle>{post.author}</MDBCardTitle>
                    <MDBCardText>{post.content}</MDBCardText>
                    <MDBCardText>
                      <small>{new Date(post.createdAt).toLocaleString()}</small>
                    </MDBCardText>
                    <MDBCardText>
                      <small>Category: {post.category}</small>
                    </MDBCardText>

                    <MDBBtn color="danger" size="sm" onClick={() => handleLike(post.postId)}>
                      ❤️ {post.likes}
                    </MDBBtn>
                  </MDBCardBody>
                </MDBCard>
              ))}

            {/* No posts message */}
            {posts.filter(
              (post) =>
                post.locationRange <= selectedRadius &&
                (selectedCategory === "all" || post.category === selectedCategory)
            ).length === 0 && <p className="text-center">No posts available in this range.</p>}
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default SocialFeed;
