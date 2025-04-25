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

const API_BASE_URL =
  "https://7n84fk6fc0.execute-api.eu-west-1.amazonaws.com/dev";
const READ_USER_URL =
  "https://kt934ahi52.execute-api.eu-west-1.amazonaws.com/dev/read-user";

async function fetchSessionData(): Promise<{
  userID: string | null;
  userName: string | null;
  accessToken: string | null;
}> {
  const tokStr = sessionStorage.getItem("authTokens");
  if (!tokStr) return { userID: null, userName: null, accessToken: null };

  try {
    const t = JSON.parse(tokStr);
    if (!t.userID || !t.accessToken)
      return { userID: null, userName: null, accessToken: null };

    let userName: string | null = t.Name || t.username || null;

    if (!userName || userName.includes("@") || userName.match(/[0-9a-f-]{8}-/i)) {
      const r = await fetch(READ_USER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t.accessToken}`,
        },
        body: JSON.stringify({ UserID: t.userID }),
      });
      if (r.ok) {
        const d = await r.json();
        if (d.Name) {
          userName = d.Name;
          t.Name = userName;
          sessionStorage.setItem("authTokens", JSON.stringify(t));
        }
      }
    }

    return { userID: t.userID, userName, accessToken: t.accessToken };
  } catch {
    return { userID: null, userName: null, accessToken: null };
  }
}

const getOrdinal = (n: number) =>
  n > 3 && n < 21 ? "th" : ["th", "st", "nd", "rd"][Math.min(n % 10, 4)];
const formatDateTime = (s: string) => {
  const d = new Date(s);
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${day}${getOrdinal(day)} ${month} ${year}, ${h}:${m < 10 ? "0" : ""}${m} ${ampm}`;
};

const formatCommentStamp = (s: string) => {
  const d = new Date(s);
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "short" }); // Apr
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${day} ${month} at ${h}:${m < 10 ? "0" : ""}${m}${ampm}`;
};

interface Post {
  PostID: string;
  Content: string;
  UserName: string;
  CreatedAt: string;
  Likes: number;
  Tags: string[];
  UserID: string;
  College?: string;
  AreaOfStudy?: string;
}
interface Comment {
  CommentID: string;
  UserID: string;
  Content: string;
  CreatedAt: string;
  Author?: string;
}

const ViewPost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  /* session */
  useEffect(() => {
    (async () => {
      const s = await fetchSessionData();
      setCurrentUserID(s.userID);
      setCurrentUserName(s.userName);
      setAccessToken(s.accessToken);
    })();
  }, []);

  /* fetch post & comments */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await fetch(`${API_BASE_URL}/get-posts/${postId}`);
        if (!p.ok) throw new Error("Failed to load post");
        setPost(await p.json());

        const c = await fetch(`${API_BASE_URL}/get-comments/${postId}`);
        if (!c.ok) throw new Error("Failed to load comments");
        setComments((await c.json()).comments ?? []);
      } catch (e) {
        setError((e as Error).message);
      }
      setLoading(false);
    };
    load();
  }, [postId]);

  useEffect(() => {
    if (!accessToken) return;
    const missing = comments.filter((c) => !c.Author);
    if (missing.length === 0) return;

    const ids = [...new Set(missing.map((c) => c.UserID))];
    (async () => {
      try {
        const lookups = await Promise.all(
          ids.map((uid) =>
            fetch(READ_USER_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ UserID: uid }),
            }).then((r) => (r.ok ? r.json() : null))
          )
        );
        const map: Record<string, string> = {};
        lookups.forEach((u, i) => {
          const n = u?.Name || u?.UserName || u?.username;
          if (n) map[ids[i]] = n;
        });
        if (Object.keys(map).length) {
          setComments((prev) =>
            prev.map((c) =>
              c.Author || !map[c.UserID] ? c : { ...c, Author: map[c.UserID] }
            )
          );
        }
      } catch (e) {
        console.error("author lookup failed:", e);
      }
    })();
  }, [comments, accessToken]);

  /* create comment */
  const handleCommentSubmit = async () => {
    if (!currentUserID) {
      setError("Please log in to comment");
      return;
    }
    if (!newComment.trim()) return;

    try {
      const r = await fetch(`${API_BASE_URL}/create-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PostID: postId,
          Content: newComment,
          UserID: currentUserID,
          Author: currentUserName ?? "Anonymous",
        }),
      });
      if (!r.ok) throw new Error("Failed to add comment");

      setComments((prev) => [
        ...prev,
        {
          CommentID: crypto.randomUUID(),
          UserID: currentUserID,
          Content: newComment,
          CreatedAt: new Date().toISOString(),
          Author: currentUserName ?? "You",
        },
      ]);
      setNewComment("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  /* like */
  const handleLike = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/like-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId }),
      });
      if (!r.ok) return;
      const d = await r.json();
      setPost((p) => (p ? { ...p, Likes: d.UpdatedLikes } : p));
    } catch (e) {
      console.error("like failed:", e);
    }
  };

  /* delete */
  const handleDelete = async () => {
    if (!currentUserID) return;
    try {
      const r = await fetch(`${API_BASE_URL}/delete-post`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId, UserID: currentUserID }),
      });
      if (r.ok) navigate("/social-feed");
      else setError(await r.text());
    } catch {
      setError("Delete failed");
    }
  };

  /* render */
  return (
    <MDBContainer className="mt-3">
      <MDBBtn color="light" onClick={() => navigate("/social-feed")} className="mb-3">
        <MDBIcon fas icon="arrow-left" /> Back
      </MDBBtn>

      {loading && <p>Loading…</p>}
      {error && <p className="text-danger">{error}</p>}

      {post && (
        <MDBCard className="mb-4">
          <MDBCardBody>
            <p className="mb-0">
              <small>Posted by {post.UserName}</small>
            </p>
            <MDBCardText>{post.Content}</MDBCardText>
            <MDBCardText>
              <small>{formatDateTime(post.CreatedAt)}</small>
            </MDBCardText>

            <MDBBtn color="danger" size="sm" onClick={handleLike} className="me-2">
              ❤️ {post.Likes}
            </MDBBtn>
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
      {comments.map((c) => (
        <MDBCard key={c.CommentID} className="mb-3">
          <MDBCardBody>
            <MDBCardText className="mb-0">
              <strong>{c.Author ?? "…"}</strong>{" "}
              <small className="text-muted">{formatCommentStamp(c.CreatedAt)}</small>
            </MDBCardText>
            <MDBCardText>{c.Content}</MDBCardText>
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
