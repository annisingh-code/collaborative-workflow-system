const TaskCard = ({
  task,
  getDependencyTitles,
  updateTaskStatus,
  handleRetryTask,
  handleDeleteTask,
  handleViewHistory,
}) => {
  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        padding: "20px",
        borderRadius: "8px",
        background: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <h3 style={{ margin: "0" }}>
          {task.title}

          <span
            style={{
              fontSize: "12px",
              color: "#666",
              marginLeft: "5px",
            }}
          >
            (v{task.versionNumber})
          </span>
        </h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={() => handleViewHistory(task._id)}
            title="History"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            🕒
          </button>

          <button
            onClick={() => handleDeleteTask(task._id)}
            title="Delete"
            style={{
              background: "none",
              border: "none",
              color: "#dc3545",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Task Details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          fontSize: "14px",
          color: "#555",
          background: "#f8f9fa",
          padding: "10px",
          borderRadius: "4px",
          marginTop: "10px",
        }}
      >
        <p style={{ margin: 0 }}>
          Status:{" "}
          <strong
            style={{
              color:
                task.status === "Completed"
                  ? "#28a745"
                  : task.status === "Failed"
                    ? "#dc3545"
                    : "#007bff",
            }}
          >
            {task.status}
          </strong>
        </p>

        <p style={{ margin: 0 }}>
          Priority: {task.priority} | Est: {task.estimatedHours}h
        </p>

        <p style={{ margin: 0 }}>Resource: {task.resourceTag || "None"}</p>

        <p style={{ margin: 0 }}>
          Depends On: {getDependencyTitles(task.dependencies)}
        </p>
      </div>

      {/* Action Buttons */}
      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "15px",
          alignItems: "center",
        }}
      >
        {/* Pending -> Running */}
        {task.status === "Pending" && (
          <button
            onClick={() => updateTaskStatus(task, "Running")}
            style={{
              padding: "8px 12px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "140px",
            }}
          >
            Mark Running
          </button>
        )}

        {/* Running -> Completed */}
        {task.status === "Running" && (
          <button
            onClick={() => updateTaskStatus(task, "Completed")}
            style={{
              padding: "8px 12px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "140px",
            }}
          >
            Mark Completed
          </button>
        )}

        {/* Running -> Failed */}
        {task.status === "Running" && (
          <button
            onClick={() => updateTaskStatus(task, "Failed")}
            style={{
              padding: "8px 12px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "140px",
            }}
          >
            Mark Failed
          </button>
        )}

        {/* Failed -> Retry */}
        {task.status === "Failed" && (
          <button
            onClick={() => handleRetryTask(task)}
            style={{
              padding: "8px 12px",
              background: "#ffc107",
              color: "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "140px",
            }}
          >
            Retry Task
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
