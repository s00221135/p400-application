import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation"; // Adjust path if needed
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBInput,
  MDBCheckbox,
} from "mdb-react-ui-kit";

// Adjust to your actual endpoints
const API_BASE_URL = "https://nlqi44a390.execute-api.eu-west-1.amazonaws.com/dev";
const HOUSEHOLD_ID = "house-001"; // Replace with actual HouseholdID or fetch from localStorage/Cognito

interface Task {
  TaskID: string;
  Title: string;
  AssignedTo: string;
  Frequency: string;
  DueDate: string;
  Completed: boolean;
}

// Example shape for a household user
interface HouseholdUser {
  UserID: string;
  Name: string;
  Email?: string;
  // Add other fields as needed
}

const CleaningRota: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [householdUsers, setHouseholdUsers] = useState<HouseholdUser[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal-related states
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    TaskID: "",
    Title: "",
    AssignedTo: "",
    Frequency: "",
    DueDate: "",
    Completed: false,
  });

  /* ----------------------------------
   * 1) Fetch Tasks from API
   * ---------------------------------- */
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/tasks?HouseholdID=${encodeURIComponent(
        HOUSEHOLD_ID
      )}`;
      console.log("📡 Fetching tasks from:", url);

      const response = await fetch(url);
      const textResponse = await response.text();
      console.log("✅ RAW API Response:", textResponse);

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("🚨 JSON Parse Error:", e);
        setError("Invalid API response format.");
        return;
      }

      if (response.ok) {
        if (!data.tasks || !Array.isArray(data.tasks)) {
          console.warn("⚠️ No tasks found or incorrect format.");
          setTasks([]);
        } else {
          setTasks(data.tasks);
        }
      } else {
        setError(data.message || "Failed to load tasks.");
      }
    } catch (err) {
      console.error("🚨 Error fetching tasks:", err);
      setError("Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
   * 2) Fetch Household Users
   * ---------------------------------- */
  const fetchHouseholdUsers = async () => {
    try {
      // Example endpoint: GET /household-users?HouseholdID=house-001
      const url = `${API_BASE_URL}/household-users?HouseholdID=${encodeURIComponent(
        HOUSEHOLD_ID
      )}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch household users");
      }

      const data = await response.json();
      if (Array.isArray(data.users)) {
        setHouseholdUsers(data.users);
      } else {
        console.warn("No 'users' array found in response");
      }
    } catch (err) {
      console.error("🚨 Error fetching household users:", err);
    }
  };

  /* ----------------------------------
   * 3) useEffect: Load tasks + users
   * ---------------------------------- */
  useEffect(() => {
    fetchTasks();
    fetchHouseholdUsers();
  }, []);

  /* ----------------------------------
   * 4) Add or Edit Task
   * ---------------------------------- */
  const saveTask = async () => {
    if (!newTask.Title.trim()) {
      alert("Task title is required.");
      return;
    }
    if (!newTask.AssignedTo) {
      alert("Please assign the task to someone.");
      return;
    }

    const requestMethod = editMode ? "PUT" : "POST";
    const requestUrl = editMode
      ? `${API_BASE_URL}/tasks/${currentTask?.TaskID}`
      : `${API_BASE_URL}/tasks`;

    try {
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          HouseholdID: HOUSEHOLD_ID,
          ...newTask,
        }),
      });

      if (response.ok) {
        // refresh tasks
        fetchTasks();
        // close modal
        setModalOpen(false);
      } else {
        alert("Failed to save task.");
      }
    } catch (err) {
      console.error("🚨 Error saving task:", err);
      alert("Error saving task.");
    }
  };

  /* ----------------------------------
   * 5) Delete Task
   * ---------------------------------- */
  const deleteTask = async (taskID: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks/${taskID}?HouseholdID=${HOUSEHOLD_ID}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchTasks();
      } else {
        alert("Failed to delete task.");
      }
    } catch (err) {
      console.error("🚨 Error deleting task:", err);
      alert("Error deleting task.");
    }
  };

  /* ----------------------------------
   * 6) Toggle Task Completion
   * ---------------------------------- */
  const toggleTaskCompletion = async (task: Task) => {
    try {
      const updatedTask = { ...task, Completed: !task.Completed };
      const response = await fetch(`${API_BASE_URL}/tasks/${task.TaskID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ HouseholdID: HOUSEHOLD_ID, ...updatedTask }),
      });

      if (response.ok) {
        fetchTasks();
      } else {
        alert("Failed to update task status.");
      }
    } catch (err) {
      console.error("🚨 Error updating task:", err);
      alert("Error updating task.");
    }
  };

  return (
    <>
      <Navigation />

      <MDBContainer fluid style={{ marginTop: "56px", padding: "2rem" }}>
        <MDBRow className="justify-content-center">
          <MDBCol xs="12" sm="10" md="8" lg="6">
            <h2 className="text-center">Cleaning Rota</h2>
            <p className="text-center text-muted">
              Manage household cleaning tasks
            </p>

            {/* Add Task Button */}
            <div className="text-center mb-3">
              <MDBBtn
                color="primary"
                onClick={() => {
                  setEditMode(false);
                  setNewTask({
                    TaskID: "",
                    Title: "",
                    AssignedTo: "",
                    Frequency: "",
                    DueDate: "",
                    Completed: false,
                  });
                  setModalOpen(true);
                }}
              >
                Add Task
              </MDBBtn>
            </div>

            {loading && <p className="text-center text-muted">Loading tasks...</p>}
            {error && <p className="text-danger text-center">{error}</p>}

            {/* Task List */}
            {tasks.length === 0 && !loading ? (
              <p className="text-center text-muted">Nothing to do yet...</p>
            ) : (
              tasks.map((task) => (
                <MDBCard
                  key={task.TaskID}
                  className={`mb-3 ${task.Completed ? "bg-light" : ""}`}
                >
                  <MDBCardBody>
                    <h5 className="fw-bold">{task.Title}</h5>
                    <p>
                      <strong>Assigned To:</strong> {task.AssignedTo}
                    </p>
                    <p>
                      <strong>Frequency:</strong> {task.Frequency}
                    </p>
                    <p>
                      <strong>Due Date:</strong> {task.DueDate}
                    </p>

                    {/* Task Completed Checkbox */}
                    <MDBCheckbox
                      name="completed"
                      checked={task.Completed}
                      onChange={() => toggleTaskCompletion(task)}
                      label="Mark as Completed"
                    />

                    <MDBRow className="mt-2">
                      <MDBCol>
                        <MDBBtn
                          color="info"
                          size="sm"
                          onClick={() => {
                            setEditMode(true);
                            setNewTask(task);
                            setCurrentTask(task);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </MDBBtn>
                      </MDBCol>
                      <MDBCol>
                        <MDBBtn
                          color="danger"
                          size="sm"
                          onClick={() => deleteTask(task.TaskID)}
                        >
                          Delete
                        </MDBBtn>
                      </MDBCol>
                    </MDBRow>
                  </MDBCardBody>
                </MDBCard>
              ))
            )}
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      {/* Add/Edit Task Modal */}
      <MDBModal show={modalOpen} setShow={setModalOpen} tabIndex="-1">
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>
                {editMode ? "Edit Task" : "Add Task"}
              </MDBModalTitle>
              <MDBBtn
                className="btn-close"
                color="none"
                onClick={() => setModalOpen(false)}
              ></MDBBtn>
            </MDBModalHeader>

            <MDBModalBody>
              <MDBInput
                label="Task Title"
                type="text"
                value={newTask.Title}
                onChange={(e) =>
                  setNewTask({ ...newTask, Title: e.target.value })
                }
                className="mb-3"
              />

              {/* Replace AssignedTo input with a dropdown */}
              <div className="mb-3">
                <label className="form-label">Assigned To</label>
                <select
                  className="form-select"
                  value={newTask.AssignedTo}
                  onChange={(e) =>
                    setNewTask({ ...newTask, AssignedTo: e.target.value })
                  }
                >
                  <option value="">-- Select a Housemate --</option>
                  {householdUsers.map((user) => (
                    <option key={user.UserID} value={user.Name}>
                      {user.Name}
                    </option>
                  ))}
                </select>
              </div>

              <MDBInput
                label="Frequency"
                type="text"
                value={newTask.Frequency}
                onChange={(e) =>
                  setNewTask({ ...newTask, Frequency: e.target.value })
                }
                className="mb-3"
              />
              <MDBInput
                label="Due Date"
                type="date"
                value={newTask.DueDate}
                onChange={(e) =>
                  setNewTask({ ...newTask, DueDate: e.target.value })
                }
                className="mb-3"
              />
            </MDBModalBody>

            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </MDBBtn>
              <MDBBtn color="primary" onClick={saveTask}>
                Save
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
};

export default CleaningRota;
