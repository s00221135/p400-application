import React, { useState } from "react";
import Navigation from "../components/Navigation"; // Adjust path to your Navigation component
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBRow,
  MDBCol,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBInput,
} from "mdb-react-ui-kit";

interface Task {
  id: number;
  title: string;
  assignedTo: string;
  frequency: string;
  dueDate: string;
}

const CleaningRota: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Take Out the Bins",
      assignedTo: "Fergal",
      frequency: "Rotates Weekly",
      dueDate: "2025-01-07",
    },
    {
      id: 2,
      title: "Wash Dishes",
      assignedTo: "Everyone",
      frequency: "Daily",
      dueDate: "2025-01-08",
    },
    {
      id: 3,
      title: "Clean Fridge",
      assignedTo: "Tom",
      frequency: "Rotates Monthly",
      dueDate: "2025-02-01",
    },
    {
      id: 4,
      title: "Clean Living Room",
      assignedTo: "Fergal",
      frequency: "Once Off",
      dueDate: "2025-01-15",
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    id: 0,
    title: "",
    assignedTo: "",
    frequency: "",
    dueDate: "",
  });

  const toggleModal = () => setModalOpen(!modalOpen);

  const handleInputChange = (field: keyof Task, value: string) => {
    setNewTask({ ...newTask, [field]: value });
  };

  const handleAddTask = () => {
    setEditMode(false);
    setNewTask({ id: 0, title: "", assignedTo: "", frequency: "", dueDate: "" });
    toggleModal();
  };

  const handleEditTask = (task: Task) => {
    setEditMode(true);
    setNewTask(task);
    setCurrentTask(task);
    toggleModal();
  };

  const saveTask = () => {
    if (editMode && currentTask) {
      // Update existing task
      setTasks((prev) =>
        prev.map((t) => (t.id === currentTask.id ? newTask : t))
      );
    } else {
      // Add new task
      const newId = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1;
      setTasks([...tasks, { ...newTask, id: newId }]);
    }
    toggleModal();
  };

  const deleteTask = (taskId: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  return (
    <>
      {/* Navigation at the top */}
      <Navigation />

      <MDBContainer className="mt-4">
        <h2 className="text-center">Cleaning Rota</h2>
        <p className="text-center text-muted">Manage household cleaning tasks</p>
        <MDBRow className="mb-3">
          <MDBCol className="text-center">
            <MDBBtn color="primary" onClick={handleAddTask}>
              Add Task
            </MDBBtn>
          </MDBCol>
        </MDBRow>

        {/* Render each task */}
        {tasks.map((task) => (
          <MDBCard key={task.id} className="mb-3">
            <MDBCardBody>
              <h5 className="fw-bold">{task.title}</h5>
              <p>
                <strong>Assigned To:</strong> {task.assignedTo}
              </p>
              <p>
                <strong>Frequency:</strong> {task.frequency}
              </p>
              <p>
                <strong>Due Date:</strong> {task.dueDate}
              </p>
              <MDBRow>
                <MDBCol>
                  <MDBBtn
                    color="info"
                    size="sm"
                    onClick={() => handleEditTask(task)}
                  >
                    Edit
                  </MDBBtn>
                </MDBCol>
                <MDBCol>
                  <MDBBtn
                    color="danger"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </MDBBtn>
                </MDBCol>
              </MDBRow>
            </MDBCardBody>
          </MDBCard>
        ))}

        {/* Modal for Add/Edit */}
        <MDBModal show={modalOpen} setShow={setModalOpen}>
          <MDBModalDialog>
            <MDBModalContent>
              <MDBModalHeader>
                <MDBModalTitle>
                  {editMode ? "Edit Task" : "Add Task"}
                </MDBModalTitle>
                <MDBBtn className="btn-close" color="none" onClick={toggleModal} />
              </MDBModalHeader>
              <MDBModalBody>
                <MDBInput
                  label="Task Title"
                  type="text"
                  value={newTask.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mb-3"
                />
                <MDBInput
                  label="Assigned To"
                  type="text"
                  value={newTask.assignedTo}
                  onChange={(e) =>
                    handleInputChange("assignedTo", e.target.value)
                  }
                  className="mb-3"
                />
                <MDBInput
                  label="Frequency"
                  type="text"
                  value={newTask.frequency}
                  onChange={(e) =>
                    handleInputChange("frequency", e.target.value)
                  }
                  className="mb-3"
                />
                <MDBInput
                  label="Due Date"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    handleInputChange("dueDate", e.target.value)
                  }
                  className="mb-3"
                />
              </MDBModalBody>
              <MDBModalFooter>
                <MDBBtn color="secondary" onClick={toggleModal}>
                  Cancel
                </MDBBtn>
                <MDBBtn color="primary" onClick={saveTask}>
                  Save
                </MDBBtn>
              </MDBModalFooter>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>
      </MDBContainer>
    </>
  );
};

export default CleaningRota;
