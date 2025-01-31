import React, { useState } from "react";
import {
  MDBContainer,
  MDBInput,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
} from "mdb-react-ui-kit";

const AddPost: React.FC = () => {
  const [postContent, setPostContent] = useState("");

  const handleSubmit = async () => {
    const newPost = {
      content: postContent,
      author: "User123", // Replace with actual logged-in user
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    try {
      await fetch("https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      alert("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
    }

    setPostContent("");
  };

  return (
    <MDBContainer className="mt-4">
      <MDBCard>
        <MDBCardBody>
          <MDBCardTitle>Create a Post</MDBCardTitle>
          <MDBCardText>What's on your mind?</MDBCardText>
          <MDBInput
            type="textarea"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="mb-3"
          />
          <MDBBtn color="primary" onClick={handleSubmit}>
            Post
          </MDBBtn>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
};

export default AddPost;
