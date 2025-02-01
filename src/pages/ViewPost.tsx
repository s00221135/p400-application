import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBInput,
  MDBBtn,
  MDBIcon,
} from "mdb-react-ui-kit";

const API_BASE_URL = "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev";

interface Post {
  PostID: string;
  Content: string;
  UserName: string;
  CreatedAt: string;
  Likes: number;
  Tags: string[];
}

interface Comment {
  CommentID: string;
  Author: string;
  Content: string;
  CreatedAt: string;
}

const ViewPost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch post details & comments
  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true);
      setError(null);

      try {
        const postResponse = await fetch(`${API_BASE_URL}/get-posts/${postId}`);
        if (!postResponse.ok) throw new Error(`Failed to fetch post: ${postResponse.status}`);
        const postData = await postResponse.json();
        setPost(postData);

        const commentsResponse = await fetch(`${API_BASE_URL}/get-comments/${postId}`);
        if (!commentsResponse.ok) throw new Error(`Failed to fetch comments: ${commentsResponse.status}`);
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load post or comments.");
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  // ✅ Handle Comment Submission
  const handleCommentSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/create-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PostID: postId,
          Content: newComment,
          UserID: "12345-abcde",
        }),
      });

      if (!response.ok) throw new Error("Failed to post comment.");

      const newCommentData = {
        CommentID: crypto.randomUUID(),
        Content: newComment,
        Author: "User123",
        CreatedAt: new Date().toISOString(),
      };

      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment.");
    }
  };

  // ✅ Handle Like
  const handleLike = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/like-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId }),
      });

      const data = await response.json();

      if (response.ok) {
        setPost((prev) => prev ? { ...prev, Likes: data.UpdatedLikes } : null);
      } else {
        console.error("Error updating likes:", data.message);
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  return (
    <MDBContainer className="mt-3">
      <MDBBtn color="light" onClick={() => navigate(-1)} className="mb-3">
        <MDBIcon fas icon="arrow-left" /> Back
      </MDBBtn>

      {loading && <p>Loading post...</p>}
      {error && <p className="text-danger">{error}</p>}

      {post && (
        <MDBCard className="mb-4">
          <MDBCardBody>
            <MDBCardTitle>{post.UserName}</MDBCardTitle>
            <MDBCardText>{post.Content}</MDBCardText>
            <MDBCardText><small>{new Date(post.CreatedAt).toLocaleString()}</small></MDBCardText>
            <MDBCardText>Tags: {post.Tags.join(", ")}</MDBCardText>

            <MDBBtn color="danger" size="sm" onClick={handleLike}>
              ❤️ {post.Likes}
            </MDBBtn>
          </MDBCardBody>
        </MDBCard>
      )}

      <h5>Comments</h5>
      {comments.length === 0 && !loading && <p>No comments yet.</p>}

      {comments.map((comment) => (
        <MDBCard key={comment.CommentID} className="mb-3">
          <MDBCardBody>
            <MDBCardTitle>{comment.Author}</MDBCardTitle>
            <MDBCardText>{comment.Content}</MDBCardText>
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

export default ViewPost;
