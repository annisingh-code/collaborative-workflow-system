import { useEffect, useState } from "react";
import api from "../utils/api";
import { useParams, useNavigate } from "react-router-dom";

import TaskCard from "../components/TaskCard";
import useProjectSocket from "../hooks/useProjectSocket";


const TaskBoard = () => {
  const { projectId } = useParams();

  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);

  const [conflictError, setConflictError] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [creatingTask, setCreatingTask] =
    useState(false);

  const [simulationResult, setSimulationResult] =
    useState(null);

  const [executionPlan, setExecutionPlan] =
    useState(null);

  // Form state
  const [newTask, setNewTask] =
    useState({
      title: "",
      priority: 3,
      estimatedHours: 1,
      dependencies: [],
      resourceTag: "",
      maxRetries: 3,
    });

  // Realtime socket handling
  useProjectSocket(
    projectId,

    // Task updated
    (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === updatedTask._id
            ? updatedTask
            : task
        )
      );
    },

    // Task created
    (createdTask) => {
      setTasks((prevTasks) => {
        const alreadyExists =
          prevTasks.some(
            (task) =>
              task._id === createdTask._id
          );

        if (alreadyExists) {
          return prevTasks;
        }

        return [...prevTasks, createdTask];
      });
    }
  );

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get(
          `/projects/${projectId}/tasks`
        );

        setTasks(data);
      } catch (err) {
        if (
          err.response?.status === 401
        ) {
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId, navigate]);

  // Create task
  const handleCreateTask = async (
    e
  ) => {
    e.preventDefault();

    setCreatingTask(true);

    try {
      const { data } = await api.post(
        `/projects/${projectId}/tasks`,
        newTask
      );

      setTasks((prevTasks) => {
        const alreadyExists =
          prevTasks.some(
            (task) =>
              task._id === data._id
          );

        if (alreadyExists) {
          return prevTasks;
        }

        return [...prevTasks, data];
      });

      setNewTask({
        title: "",
        priority: 3,
        estimatedHours: 1,
        dependencies: [],
        resourceTag: "",
        maxRetries: 3,
      });
    } catch (err) {
      alert(
        "Error creating task: " +
          (err.response?.data?.message ||
            err.message)
      );
    } finally {
      setCreatingTask(false);
    }
  };

  // Update task status
  const updateTaskStatus = async (
    task,
    newStatus
  ) => {
    setConflictError(null);

    try {
      const { data } = await api.put(
        `/projects/${projectId}/tasks/${task._id}`,
        {
          status: newStatus,
          versionNumber:
            task.versionNumber,
        }
      );

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t._id === data._id
            ? data
            : t
        )
      );
    } catch (err) {
      if (
        err.response?.status === 409
      ) {
        setConflictError({
          message:
            err.response.data.message,
          latestTask:
            err.response.data.latestData,
        });
      } else {
        alert(
          err.response?.data?.message ||
            "Update failed"
        );
      }
    }
  };

  // Delete task
  const handleDeleteTask = async (
    taskId
  ) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmDelete) return;

    try {
      await api.delete(
        `/projects/${projectId}/tasks/${taskId}`
      );

      setTasks((prevTasks) =>
        prevTasks.filter(
          (task) =>
            task._id !== taskId
        )
      );
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  // Retry failed task
  const handleRetryTask = async (
    task
  ) => {
    try {
      const { data } = await api.post(
        `/projects/${projectId}/tasks/${task._id}/retry`
      );

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t._id === data._id
            ? data
            : t
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Retry failed"
      );
    }
  };

  // View task history
  const handleViewHistory = async (
    taskId
  ) => {
    try {
      const { data } = await api.get(
        `/projects/${projectId}/tasks/${taskId}/history`
      );

      if (data.length === 0) {
        alert(
          "No history found for this task yet."
        );

        return;
      }

      const historyString = data
        .map((log) => {
          const status =
            log.metadata?.newStatus ||
            log.metadata?.status ||
            "N/A";

          const version =
            log.metadata?.newVersion ||
            log.metadata?.version ||
            "N/A";

          return `[${new Date(
            log.createdAt
          ).toLocaleString()}] ${
            log.action
          } - Status: ${status} (v${version})`;
        })
        .join("\n");

      alert(
        `Task History:\n\n${historyString}`
      );
    } catch (err) {
      alert("Failed to fetch history");
    }
  };

  // Execution plan
  const handleRunExecutionPlan =
    async () => {
      try {
        const { data } =
          await api.post(
            `/projects/${projectId}/compute-execution`
          );

        setExecutionPlan(
          data.executionOrder
        );

        setSimulationResult(null);
      } catch (err) {
        alert(
          err.response?.data?.message ||
            "Failed to compute execution plan"
        );
      }
    };

  // Daily simulation
  const handleRunSimulation =
    async () => {
      try {
        const hours = prompt(
          "Enter available hours for today's simulation:",
          "8"
        );

        if (!hours) return;

        const { data } =
          await api.post(
            `/projects/${projectId}/simulate`,
            {
              availableHours:
                Number(hours),
            }
          );

        setSimulationResult(data);

        setExecutionPlan(null);
      } catch (err) {
        alert(
          err.response?.data?.message ||
            "Simulation failed"
        );
      }
    };

  // Dependency display helper
  const getDependencyTitles = (
    dependencies
  ) => {
    if (
      !dependencies ||
      dependencies.length === 0
    ) {
      return "None";
    }

    return dependencies
      .map((dep) => {
        if (
          typeof dep === "object" &&
          dep !== null &&
          dep.title
        ) {
          return dep.title;
        }

        const depId =
          typeof dep === "object"
            ? dep._id
            : dep;

        const foundTask = tasks.find(
          (task) => task._id === depId
        );

        return foundTask
          ? foundTask.title
          : "Unknown";
      })
      .join(", ");
  };

  // Loading
  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        Loading workspace...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <h2>Orchestration Board</h2>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={() =>
              navigate("/projects")
            }
            style={{
              padding: "8px",
            }}
          >
            Back to Projects
          </button>

          <button
            onClick={
              handleRunExecutionPlan
            }
            style={{
              padding: "8px",
              background: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Get Execution Plan
          </button>

          <button
            onClick={handleRunSimulation}
            style={{
              padding: "8px",
              background: "#6f42c1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Run Daily Simulation
          </button>
        </div>
      </div>

      <hr
        style={{
          marginBottom: "20px",
        }}
      />

      {/* Execution Plan */}
      {executionPlan && (
        <div
          style={{
            background: "#d1ecf1",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border:
              "1px solid #bee5eb",
          }}
        >
          <h3>Valid Execution Plan</h3>

          <ol>
            {executionPlan.map(
              (task, index) => (
                <li key={index}>
                  <strong>
                    {task.title}
                  </strong>{" "}
                  (Priority:{" "}
                  {task.priority},{" "}
                  {
                    task.estimatedHours
                  }
                  h)
                </li>
              )
            )}
          </ol>

          <button
            onClick={() =>
              setExecutionPlan(null)
            }
            style={{
              padding: "5px",
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Simulation Result */}
      {simulationResult && (
        <div
          style={{
            background: "#e2e3e5",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <h3>Simulation Results</h3>

          <p>
            <strong>
              Total Priority Score:
            </strong>{" "}
            {
              simulationResult.totalPriorityScore
            }
          </p>

          <p>
            <strong>
              Execution Order:
            </strong>{" "}
            {simulationResult.executionOrder
              .map((t) => t.title)
              .join(" ➔ ") ||
              "None"}
          </p>

          <p>
            <strong>
              Selected Tasks:
            </strong>{" "}
            {simulationResult.selectedTasks
              .map((t) => t.title)
              .join(", ") || "None"}
          </p>

          <p>
            <strong>
              Blocked Tasks:
            </strong>{" "}
            {simulationResult.blockedTasks
              ?.map((t) => t.title)
              .join(", ") || "None"}
          </p>

          <p>
            <strong>
              Skipped Tasks:
            </strong>{" "}
            {simulationResult.skippedTasks
              .map((t) => t.title)
              .join(", ") || "None"}
          </p>

          <button
            onClick={() =>
              setSimulationResult(null)
            }
            style={{
              padding: "5px",
              marginTop: "10px",
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Conflict */}
      {conflictError && (
        <div
          style={{
            background: "#ffcccc",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "5px",
            border:
              "1px solid #ff9999",
          }}
        >
          <strong>
            ⚠️ Version Conflict:
          </strong>{" "}
          {conflictError.message}

          <button
            style={{
              marginLeft: "15px",
              padding: "5px 10px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => {
              setTasks((prevTasks) =>
                prevTasks.map((task) =>
                  task._id ===
                  conflictError
                    .latestTask._id
                    ? conflictError.latestTask
                    : task
                )
              );

              setConflictError(null);
            }}
          >
            Refresh Data
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div
        style={{
          display: "flex",
          gap: "20px",
        }}
      >
        {/* Form */}
        <div
          style={{
            flex: "1",
            background: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            height: "fit-content",
          }}
        >
          <h3>Create New Task</h3>

          <form
            onSubmit={handleCreateTask}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <input
              type="text"
              placeholder="Task Title"
              required
              value={newTask.title}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  title:
                    e.target.value,
                })
              }
              style={{
                padding: "8px",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "10px",
              }}
            >
              <label>
                Priority (1-5):
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: Number(
                        e.target.value
                      ),
                    })
                  }
                  style={{
                    width: "100%",
                  }}
                />
              </label>

              <label>
                Est. Hours:
                <input
                  type="number"
                  min="1"
                  value={
                    newTask.estimatedHours
                  }
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      estimatedHours:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  style={{
                    width: "100%",
                  }}
                />
              </label>
            </div>

            <input
              type="text"
              placeholder="Resource Tag"
              value={newTask.resourceTag}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  resourceTag:
                    e.target.value,
                })
              }
              style={{
                padding: "8px",
              }}
            />

            <label>
              Max Retries:
              <input
                type="number"
                min="0"
                value={newTask.maxRetries}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    maxRetries: Number(
                      e.target.value
                    ),
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "5px",
                }}
              />
            </label>

            <label>
              Dependencies:
              <select
                multiple
                value={
                  newTask.dependencies
                }
                onChange={(e) => {
                  const options =
                    Array.from(
                      e.target.options
                    );

                  setNewTask({
                    ...newTask,
                    dependencies:
                      options
                        .filter(
                          (option) =>
                            option.selected
                        )
                        .map(
                          (option) =>
                            option.value
                        ),
                  });
                }}
                style={{
                  width: "100%",
                  height: "100px",
                }}
              >
                {tasks.map((task) => (
                  <option
                    key={task._id}
                    value={task._id}
                  >
                    {task.title}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={creatingTask}
              style={{
                padding: "10px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {creatingTask
                ? "Creating..."
                : "Add Task"}
            </button>
          </form>
        </div>

        {/* Tasks */}
        <div
          style={{
            flex: "2",
            display: "grid",
            gap: "15px",
          }}
        >
          {tasks.length === 0 ? (
            <p>No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                getDependencyTitles={
                  getDependencyTitles
                }
                updateTaskStatus={
                  updateTaskStatus
                }
                handleRetryTask={
                  handleRetryTask
                }
                handleDeleteTask={
                  handleDeleteTask
                }
                handleViewHistory={
                  handleViewHistory
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;