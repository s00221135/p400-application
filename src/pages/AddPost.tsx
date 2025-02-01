import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBInput,
  MDBBtn,
} from "mdb-react-ui-kit";

const API_BASE_URL = "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev";

interface Comment {
  commentId: string;
  author: string;
  content: string;
  createdAt: string;
}

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-comments/${postId}`);
        const data = await response.json();
        setComments(data.comments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async () => {
    try {
      await fetch(`${API_BASE_URL}/create-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PostID: postId,
          Content: newComment,
          UserID: "12345-abcde",
        }),
      });

      setComments([...comments, { commentId: crypto.randomUUID(), content: newComment, author: "User123", createdAt: new Date().toISOString() }]);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <MDBContainer>
      <h5>Comments</h5>
      {loading ? <p>Loading comments...</p> : comments.map(comment => (
        <MDBCard key={comment.commentId} className="mb-3">
          <MDBCardBody>
            <MDBCardTitle>{comment.author}</MDBCardTitle>
            <MDBCardText>{comment.content}</MDBCardText>
          </MDBCardBody>
        </MDBCard>
      ))}

      <MDBInput label="Add a comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
      <MDBBtn className="mt-2" onClick={handleCommentSubmit}>
        Comment
      </MDBBtn>
    </MDBContainer>
  );
};

export default PostPage;
