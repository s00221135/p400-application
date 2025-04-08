// src/pages/ViewPost.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardText,
  MDBBtn,
  MDBIcon,
  MDBInput,
} from "mdb-react-ui-kit";

const API_BASE_URL = "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev";
const READ_USER_URL = "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

// Helper function to get the ordinal suffix for a day.
const getOrdinalSuffix = (n: number): string => {
  const j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

// Helper function to format the date/time into "1st March 2025, 3:04 PM"
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  // Get full month name using Intl
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  const year = date.getFullYear();

  // Format time in 12-hour format.
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
  UserID: string;       // ID of the user who posted.
  College?: string;     // Optional college information.
  AreaOfStudy?: string; // Optional field of study information.
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
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);

  // On mount, load current user ID from sessionStorage.
  useEffect(() => {
    const tokensString = sessionStorage.getItem("authTokens");
    if (tokensString) {
      try {
        const tokens = JSON.parse(tokensString);
        if (tokens.userID) {
          setCurrentUserID(tokens.userID);
        }
      } catch (e) {
        console.error("Error parsing authTokens:", e);
      }
    }
  }, []);

  // Fetch post details & comments.
  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true);
      setError(null);

      try {
        const postResponse = await fetch(`${API_BASE_URL}/get-posts/${postId}`);
        if (!postResponse.ok)
          throw new Error(`Failed to fetch post: ${postResponse.status}`);
        const postData: Post = await postResponse.json();
        setPost(postData);

        const commentsResponse = await fetch(`${API_BASE_URL}/get-comments/${postId}`);
        if (!commentsResponse.ok)
          throw new Error(`Failed to fetch comments: ${commentsResponse.status}`);
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

  // After fetching the post, if College or AreaOfStudy is missing, fetch user details.
  useEffect(() => {
    const fetchAuthorDetails = async () => {
      if (post && (!post.College || !post.AreaOfStudy)) {
        const tokensString = sessionStorage.getItem("authTokens");
        if (!tokensString) return;
        try {
          const tokens = JSON.parse(tokensString);
          const accessToken = tokens.accessToken;
          if (!accessToken) return;

          const response = await fetch(READ_USER_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ UserID: post.UserID }),
          });

          if (response.ok) {
            const userData = await response.json();
            setPost((prev) =>
              prev
                ? {
                    ...prev,
                    College: userData.College,
                    AreaOfStudy: userData.AreaOfStudy,
                  }
                : prev
            );
          } else {
            console.error("Failed to fetch user details:", await response.text());
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    };

    fetchAuthorDetails();
  }, [post]);

  // Render the "Posted by" section.
  const renderPostedBy = (post: Post) => {
    const details: string[] = [];
    if (post.College && post.College.trim() !== "") {
      details.push(post.College);
    }
    if (post.AreaOfStudy && post.AreaOfStudy.trim() !== "") {
      details.push(post.AreaOfStudy);
    }
    return (
      <div>
        <p className="mb-0">
          <small>Posted by {post.UserName}</small>
        </p>
        {details.length > 0 && (
          <p className="mb-0">
            <small>{details.join(" │ ")}</small>
          </p>
        )}
      </div>
    );
  };

  // Handle Comment Submission.
  const handleCommentSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/create-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Replace with dynamic user info as needed.
        body: JSON.stringify({
          PostID: postId,
          Content: newComment,
          UserID: "12345-abcde", // Replace with actual dynamic info.
        }),
      });

      if (!response.ok) throw new Error("Failed to post comment.");

      const newCommentData: Comment = {
        CommentID: crypto.randomUUID(),
        Content: newComment,
        Author: "User123", // Replace with actual author if available.
        CreatedAt: new Date().toISOString(),
      };

      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment.");
    }
  };

  // Handle Like.
  const handleLike = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/like-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId }),
      });
      const data = await response.json();
      if (response.ok) {
        setPost((prev) => (prev ? { ...prev, Likes: data.UpdatedLikes } : null));
      } else {
        console.error("Error updating likes:", data.message);
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // Handle Delete Post – only allow if the current user is the post owner.
  const handleDelete = async () => {
    if (!currentUserID) return;
    try {
      const response = await fetch(`${API_BASE_URL}/delete-post`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId, UserID: currentUserID }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate("/social-feed");
      } else {
        console.error("Error deleting post:", data.message);
        setError(data.message || "Failed to delete post.");
      }
    } catch (err) {
      console.error("Network error deleting post:", err);
      setError("Network error while deleting post.");
    }
  };

  return (
    <MDBContainer className="mt-3">
      {/* Back button navigates to /social-feed */}
      <MDBBtn color="light" onClick={() => navigate("/social-feed")} className="mb-3">
        <MDBIcon fas icon="arrow-left" /> Back
      </MDBBtn>

      {loading && <p>Loading post...</p>}
      {error && <p className="text-danger">{error}</p>}

      {post && (
        <MDBCard className="mb-4">
          <MDBCardBody>
            {/* Render "Posted by" details */}
            {renderPostedBy(post)}
            <MDBCardText>{post.Content}</MDBCardText>
            <MDBCardText>
              <small>{formatDateTime(post.CreatedAt)}</small>
            </MDBCardText>
            <MDBCardText>Tags: {post.Tags.join(", ")}</MDBCardText>
            <MDBBtn color="danger" size="sm" onClick={handleLike} className="me-2">
              ❤️ {post.Likes}
            </MDBBtn>
            {/* Show Delete button only if current user is the owner */}
            {currentUserID === post.UserID && (
              <MDBBtn color="secondary" size="sm" onClick={handleDelete}>
                Delete
              </MDBBtn>
            )}
          </MDBCardBody>
        </MDBCard>
      )}

      <h5>Comments</h5>
      {comments.length === 0 && !loading && <p>No comments yet.</p>}
      {comments.map((comment) => (
        <MDBCard key={comment.CommentID} className="mb-3">
          <MDBCardBody>
            <MDBCardText>
              <strong>{comment.Author}</strong>
            </MDBCardText>
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
