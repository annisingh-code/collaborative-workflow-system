import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import api from '../utils/api';

const TaskBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [conflictError, setConflictError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Connect to WebSocket
    const socket = io('http://localhost:5000');
    
    socket.emit('joinProject', projectId);

    // 2. Listen for Real-Time Updates
    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prevTasks) => 
        prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
    });

    // 3. Initial Data Fetch
    const fetchTasks = async () => {
      try {
        const { data } = await api.get(`/projects/${projectId}/tasks`);
        setTasks(data);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Cleanup on unmount
    return () => socket.disconnect();
  }, [projectId]);

  // 4. Handle Task Updates (Optimistic Concurrency)
  const updateTaskStatus = async (task, newStatus) => {
    setConflictError(null); // Clear previous errors
    
    try {
      const { data } = await api.put(`/projects/${projectId}/tasks/${task._id}`, {
        status: newStatus,
        versionNumber: task.versionNumber // MUST pass the version we currently see
      });

      // Update local state immediately (though socket will also broadcast)
      setTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));

    } catch (err) {
      if (err.response && err.response.status === 409) {
        // CONFLICT CAUGHT! Someone else updated it first.
        setConflictError({
          message: err.response.data.message,
          latestTask: err.response.data.latestData
        });
      } else {
        alert(err.response?.data?.message || 'Update failed');
      }
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Project Tasks</h2>
      
      {/* Display Version Conflict Warning */}
      {conflictError && (
        <div style={{ background: '#ffcccc', padding: '10px', marginBottom: '20px', borderRadius: '5px' }}>
          <strong>⚠️ Version Conflict:</strong> {conflictError.message}
          <button 
            style={{ marginLeft: '10px' }}
            onClick={() => {
              // Sync local state with the latest database state
              setTasks((prev) => prev.map((t) => 
                t._id === conflictError.latestTask._id ? conflictError.latestTask : t
              ));
              setConflictError(null);
            }}
          >
            Refresh Data
          </button>
        </div>
      )}

      {/* Simple Task List */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {tasks.map((task) => (
          <div key={task._id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
            <h3>{task.title} (v{task.versionNumber})</h3>
            <p>Status: <strong>{task.status}</strong></p>
            
            {/* Quick action buttons for demo purposes */}
            {task.status !== 'Completed' && (
              <button onClick={() => updateTaskStatus(task, 'Completed')}>
                Mark Completed
              </button>
            )}
            <button onClick={() => updateTaskStatus(task, 'Running')} style={{ marginLeft: '10px' }}>
              Mark Running
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;