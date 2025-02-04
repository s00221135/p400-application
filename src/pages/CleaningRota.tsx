import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
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

// Two different base URLs because tasks and household-users are on different API IDs:
const TASKS_BASE_URL = "https://nlqi44a390.execute-api.eu-west-1.amazonaws.com/dev";
const USERS_BASE_URL = "https://kw9gdp96hl.execute-api.eu-west-1.amazonaws.com/dev";

// Replace or fetch this from localStorage/sessionStorage in your real app:
const HOUSEHOLD_ID = "house-001";

interface Task {
  TaskID: string;
  Title: string;
  AssignedTo: string; // We'll store the user's ID here
  Frequency: string;
  DueDate: string;
  Completed: boolean;
}

interface HouseholdUser {
  UserID: string;
  Name: string;
  Email?: string;
  // Additional fields if needed
}

const CleaningRota: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [householdUsers, setHouseholdUsers] = useState<HouseholdUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
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
   * 1) Fetch Tasks (using TASKS_BASE_URL)
   * ---------------------------------- */
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${TASKS_BASE_URL}/tasks?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`;
      console.log("📡 Fetching tasks from:", url);

      const response = await fetch(url);
      const textResponse = await response.text();
      console.log("✅ RAW tasks response:", textResponse);

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("🚨 JSON Parse Error (tasks):", e);
        setError("Invalid tasks API response format.");
        return;
      }

      if (response.ok) {
        if (!data.tasks || !Array.isArray(data.tasks)) {
          console.warn("⚠️ No tasks found or incorrect format.");
          setTasks([]);
        } else {
          // Sort tasks so that tasks not completed come first
          const sortedTasks = [...data.tasks].sort((a: Task, b: Task) =>
            a.Completed === b.Completed ? 0 : a.Completed ? 1 : -1
          );
          setTasks(sortedTasks);
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
   * 2) Fetch Household Users (using USERS_BASE_URL)
   * ---------------------------------- */
  const fetchHouseholdUsers = async () => {
    try {
      const url = `${USERS_BASE_URL}/household-users?HouseholdID=${encodeURIComponent(HOUSEHOLD_ID)}`;
      console.log("📡 Fetching household users from:", url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch household users (403 or other error)");
      }

      const data = await response.json();
      console.log("✅ RAW users response:", data);

      if (Array.isArray(data.users)) {
        setHouseholdUsers(data.users);
      } else {
        console.warn("No 'users' array found in user response");
      }
    } catch (err) {
      console.error("🚨 Error fetching household users:", err);
    }
  };

  /* ----------------------------------
   * 3) useEffect: Load tasks + users on mount
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
      ? `${TASKS_BASE_URL}/tasks/${currentTask?.TaskID}`
      : `${TASKS_BASE_URL}/tasks`;

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
        fetchTasks();
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
        `${TASKS_BASE_URL}/tasks/${taskID}?HouseholdID=${HOUSEHOLD_ID}`,
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
      const response = await fetch(`${TASKS_BASE_URL}/tasks/${task.TaskID}`, {
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
                  console.log("Opening modal for Add Task");
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
              tasks.map((task) => {
                // Lookup user name for display from householdUsers
                const assignedUser = householdUsers.find(
                  (u) => u.UserID === task.AssignedTo
                );
                const displayAssigned = assignedUser ? assignedUser.Name : task.AssignedTo;
                return (
                  <MDBCard
                    key={task.TaskID}
                    className={`mb-3 ${task.Completed ? "bg-light" : ""}`}
                  >
                    <MDBCardBody>
                      <h5 className="fw-bold">{task.Title}</h5>
                      <p>
                        <strong>Assigned To:</strong> {displayAssigned}
                      </p>
                      <p>
                        <strong>Frequency:</strong> {task.Frequency}
                      </p>
                      <p>
                        <strong>Due Date:</strong> {task.DueDate}
                      </p>

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
                              console.log("Opening modal for Edit Task");
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
                );
              })
            )}
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      {/* Add/Edit Task Modal */}
      {/**
       * Adjust modal props based on your mdb-react-ui-kit version.
       * For example, if you're using v6+, use show={modalOpen} setShow={setModalOpen}.
       * If using an older version, use open={modalOpen} setOpen={setModalOpen}.
       * Here we assume the older version with open/setOpen.
       */}
      <MDBModal open={modalOpen} setOpen={setModalOpen} tabIndex="-1">
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader>
              <MDBModalTitle>{editMode ? "Edit Task" : "Add Task"}</MDBModalTitle>
              <MDBBtn className="btn-close" color="none" onClick={() => setModalOpen(false)}></MDBBtn>
            </MDBModalHeader>
            <MDBModalBody>
              <MDBInput
                label="Task Title"
                type="text"
                value={newTask.Title}
                onChange={(e) => setNewTask({ ...newTask, Title: e.target.value })}
                className="mb-3"
              />
              {/* AssignedTo Dropdown */}
              <div className="mb-3">
                <label className="form-label">Assigned To</label>
                <select
                  className="form-select"
                  value={newTask.AssignedTo}
                  onChange={(e) => setNewTask({ ...newTask, AssignedTo: e.target.value })}
                >
                  <option value="">-- Select a Housemate --</option>
                  {householdUsers.map((user) => (
                    <option key={user.UserID} value={user.UserID}>
                      {user.Name}
                    </option>
                  ))}
                </select>
              </div>
              <MDBInput
                label="Frequency"
                type="text"
                value={newTask.Frequency}
                onChange={(e) => setNewTask({ ...newTask, Frequency: e.target.value })}
                className="mb-3"
              />
              <MDBInput
                label="Due Date"
                type="date"
                value={newTask.DueDate}
                onChange={(e) => setNewTask({ ...newTask, DueDate: e.target.value })}
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
