import React, { useState } from "react";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBInput,
  MDBBtn,
} from "mdb-react-ui-kit";

interface Comment {
  commentId: string;
  author: string;
  content: string;
  createdAt: string;
}

const PostPage: React.FC = () => {
  // Placeholder post instead of fetching from API
  const [post] = useState<{ content: string; author: string }>({
    content: "This is a sample post about student life!",
    author: "Alice",
  });

  // Placeholder comments
  const [comments, setComments] = useState<Comment[]>([
    {
      commentId: "1",
      author: "Bob",
      content: "Great post! Totally agree.",
      createdAt: new Date().toISOString(),
    },
    {
      commentId: "2",
      author: "Charlie",
      content: "I just moved into a new place too!",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [newComment, setNewComment] = useState("");

  const handleCommentSubmit = () => {
    // Create a new comment locally
    const commentData: Comment = {
      commentId: crypto.randomUUID(), // Generate a unique ID
      content: newComment,
      author: "User123", // Placeholder user
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, commentData]); // Add new comment locally
    setNewComment("");
  };

  return (
    <MDBContainer>
      {post && (
        <MDBCard className="mb-4">
          <MDBCardBody>
            <MDBCardTitle>{post.author}</MDBCardTitle>
            <MDBCardText>{post.content}</MDBCardText>
          </MDBCardBody>
        </MDBCard>
      )}

      <h5>Comments</h5>
      {comments.map((comment) => (
        <MDBCard key={comment.commentId} className="mb-3">
          <MDBCardBody>
            <MDBCardTitle>{comment.author}</MDBCardTitle>
            <MDBCardText>{comment.content}</MDBCardText>
          </MDBCardBody>
        </MDBCard>
      ))}

      <MDBInput
        label="Add a comment"
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <MDBBtn className="mt-2" onClick={handleCommentSubmit}>
        Comment
      </MDBBtn>
    </MDBContainer>
  );
};

export default PostPage;
