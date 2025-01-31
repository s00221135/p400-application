import React, { useState } from "react";
import {
  MDBContainer,
  MDBInput,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
} from "mdb-react-ui-kit";

// Predefined tag options
const tagOptions = ["Event", "Help Needed", "Social", "College", "Miscellaneous"];

const AddPost: React.FC = () => {
  const [postContent, setPostContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [geofence, setGeofence] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleSubmit = async () => {
    if (!geofence) {
      alert("Please set a location before posting.");
      return;
    }

    const newPost = {
      content: postContent,
      author: "User123", // Replace with actual logged-in user
      createdAt: new Date().toISOString(),
      likes: 0,
      geofence: geofence,
      tags: selectedTags, // Attach selected tags
    };

    try {
      await fetch("https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      alert("Post created successfully!");
      setPostContent("");
      setSelectedTags([]); // Reset tags
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleConfigureLocation = () => {
    setShowLocationModal(true);
  };

  // Placeholder function to simulate geofence selection
  const saveGeofence = () => {
    setGeofence("Custom Geofence Set"); // Replace with actual AWS Location Service data
    setShowLocationModal(false);
  };

  // Handle tag selection (toggle)
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    );
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

          {/* Tag Selection */}
          <div className="mb-3">
            <MDBCardText>Select Tags:</MDBCardText>
            {tagOptions.map((tag) => (
              <MDBBtn
                key={tag}
                color={selectedTags.includes(tag) ? "primary" : "secondary"}
                outline={!selectedTags.includes(tag)}
                size="sm"
                className="m-1"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </MDBBtn>
            ))}
          </div>

          {/* Configure Location Button */}
          <MDBBtn color="info" onClick={handleConfigureLocation} className="mb-2">
            Configure Location
          </MDBBtn>
          {geofence && <MDBCardText className="mt-2">📍 {geofence}</MDBCardText>}

          {/* Submit Post */}
          <MDBBtn color="primary" className="mt-3" onClick={handleSubmit}>
            Post
          </MDBBtn>
        </MDBCardBody>
      </MDBCard>

      {/* Modal for location selection */}
      <MDBModal open={showLocationModal} setOpen={setShowLocationModal}>
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>Set Post Visibility Area</MDBModalTitle>
              <MDBBtn className="btn-close" color="none" onClick={() => setShowLocationModal(false)}></MDBBtn>
            </MDBModalHeader>
            <MDBModalBody>
              {/* Placeholder Map */}
              <div style={{ height: "300px", background: "#e0e0e0", textAlign: "center", padding: "20px" }}>
                [ Map Component Goes Here ]
              </div>
              <p className="text-center mt-2">Select an area on the map for post visibility.</p>
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setShowLocationModal(false)}>Cancel</MDBBtn>
              <MDBBtn color="primary" onClick={saveGeofence}>Save Location</MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </MDBContainer>
  );
};

export default AddPost;
