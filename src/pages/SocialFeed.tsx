import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import navigation hook
import Navigation from "../components/Navigation"; // Import Navigation component
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardText,
  MDBCardTitle,
  MDBBtn,
} from "mdb-react-ui-kit";

interface Post {
  postId: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
}

const SocialFeed: React.FC = () => {
  const navigate = useNavigate(); // Hook for navigation
  const [posts, setPosts] = useState<Post[]>([
    {
      postId: "1",
      content: "Excited for the weekend! 🎉",
      author: "Alice",
      createdAt: new Date().toISOString(),
      likes: 5,
    },
    {
      postId: "2",
      content: "Just moved into my new dorm! Anyone nearby?",
      author: "Bob",
      createdAt: new Date().toISOString(),
      likes: 3,
    },
  ]);

  // Simulate liking a post (without API)
  const handleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.postId === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  return (
    <>
      {/* Navigation Bar */}
      <Navigation />

      {/* Page Content */}
      <MDBContainer>
        <MDBRow className="justify-content-center">
          <MDBCol md="8">
            <h2 className="text-center">Social Feed</h2>

            <div className="text-center mb-3">
              {/* Navigate to AddPost page instead of opening a modal */}
              <MDBBtn color="primary" onClick={() => navigate("/add-post")}>
                Create Post
              </MDBBtn>
            </div>

            {posts.map((post) => (
              <MDBCard key={post.postId} className="mb-3">
                <MDBCardBody>
                  <MDBCardTitle>{post.author}</MDBCardTitle>
                  <MDBCardText>{post.content}</MDBCardText>
                  <MDBCardText>
                    <small>{new Date(post.createdAt).toLocaleString()}</small>
                  </MDBCardText>

                  <MDBBtn color="danger" size="sm" onClick={() => handleLike(post.postId)}>
                    ❤️ {post.likes}
                  </MDBBtn>
                </MDBCardBody>
              </MDBCard>
            ))}
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
};

export default SocialFeed;
