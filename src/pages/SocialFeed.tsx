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
} from "mdb-react-ui-kit";
import Navigation from "../components/Navigation";

const API_BASE_URL = "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev";

interface Post {
  PostID: string;
  Content: string;
  UserName: string;  
  CreatedAt: string;
  Likes: number;
  Tags: string[];
  GeofenceRadius: number;
}

const SocialFeed: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-posts`);
        const data = await response.json();
        setPosts(data.posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      await fetch(`${API_BASE_URL}/like-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId }),
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.PostID === postId ? { ...post, Likes: post.Likes + 1 } : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return (
    <>
      <Navigation />
      <MDBContainer className="mt-5">
        <MDBRow className="justify-content-center">
          <MDBCol md="8">
            <MDBBtn color="primary" onClick={() => navigate("/add-post")}>
              Create Post
            </MDBBtn>

            {posts.map((post) => (
              <MDBCard
                key={post.PostID}
                className="mb-3"
                onClick={() => navigate(`/view-post/${post.PostID}`)}
                style={{ cursor: "pointer" }}
              >
                <MDBCardBody>
                  <MDBCardTitle>{post.UserName}</MDBCardTitle>
                  <MDBCardText>{post.Content}</MDBCardText>

                  <MDBBtn color="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleLike(post.PostID); }}>
                    ❤️ {post.Likes}
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
