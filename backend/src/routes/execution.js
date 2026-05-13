const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router({ mergeParams: true });

// Helper to build graph and in-degrees
const buildGraph = (tasks, explicitFailedIds = []) => {
  const adjList = {};
  const inDegree = {};
  const taskMap = {};

  // Initialize
  tasks.forEach(t => {
    const id = t._id.toString();
    adjList[id] = [];
    inDegree[id] = 0;
    taskMap[id] = t;
  });

  // Populate edges and in-degrees
  tasks.forEach(t => {
    const id = t._id.toString();
    t.dependencies.forEach(dep => {
      const depId = dep.toString();
      if (adjList[depId]) {
        adjList[depId].push(id);
        inDegree[id]++;
      }
    });
  });

  return { adjList, inDegree, taskMap };
};

// Custom sorting function: Priority (desc), EstimatedHours (asc), CreatedAt (asc)
const sortTasks = (a, b) => {
  if (b.priority !== a.priority) return b.priority - a.priority;
  if (a.estimatedHours !== b.estimatedHours) return a.estimatedHours - b.estimatedHours;
  return new Date(a.createdAt) - new Date(b.createdAt);
};

// 1. Compute Execution Plan
router.post('/compute-execution', auth, async (req, res) => {
  try {
    // Fetch tasks, excluding completely blocked ones (by status)
    const tasks = await Task.find({ 
      projectId: req.params.projectId,
      status: { $nin: ['Blocked'] } 
    }).lean();

    const { adjList, inDegree, taskMap } = buildGraph(tasks);
    let availableTasks = tasks.filter(t => inDegree[t._id.toString()] === 0);
    const executionOrder = [];

    while (availableTasks.length > 0) {
      // Sort available tasks deterministically
      availableTasks.sort(sortTasks);
      
      const currentTask = availableTasks.shift();
      executionOrder.push(currentTask);

      // Free up dependencies
      const dependents = adjList[currentTask._id.toString()] || [];
      for (let depId of dependents) {
        inDegree[depId]--;
        if (inDegree[depId] === 0) {
          availableTasks.push(taskMap[depId]);
        }
      }
    }

    res.json({ executionOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error computing execution', error: error.message });
  }
});

// 2. Daily Simulation
router.post('/simulate', auth, async (req, res) => {
  try {
    const { availableHours, failedTaskIds = [] } = req.body;
    let remainingHours = availableHours || 0;

    const tasks = await Task.find({ projectId: req.params.projectId }).lean();
    const { adjList, inDegree, taskMap } = buildGraph(tasks);

    // Track states
    const selectedTasks = [];
    const executionOrder = [];
    const blockedTasks = [];
    let totalPriorityScore = 0;

    // Treat explicit failed tasks as failed (they will block dependents)
    const failedSet = new Set(failedTaskIds);

    let availableTasks = tasks.filter(t => 
      inDegree[t._id.toString()] === 0 && 
      t.status !== 'Blocked' && 
      !failedSet.has(t._id.toString())
    );

    // Identify initially blocked tasks
    tasks.forEach(t => {
      if (t.status === 'Blocked' || failedSet.has(t._id.toString())) {
        blockedTasks.push(t);
      }
    });

    while (availableTasks.length > 0) {
      availableTasks.sort(sortTasks);
      
      // Greedy selection: Find the first task that fits within remaining time
      const taskIndex = availableTasks.findIndex(t => t.estimatedHours <= remainingHours);

      if (taskIndex !== -1) {
        const currentTask = availableTasks.splice(taskIndex, 1)[0];
        
        executionOrder.push(currentTask);
        selectedTasks.push(currentTask);
        remainingHours -= currentTask.estimatedHours;
        totalPriorityScore += currentTask.priority;

        // Unlock dependents
        const dependents = adjList[currentTask._id.toString()] || [];
        for (let depId of dependents) {
          inDegree[depId]--;
          if (inDegree[depId] === 0 && !failedSet.has(depId)) {
            availableTasks.push(taskMap[depId]);
          }
        }
      } else {
        // No available task fits in the remaining time
        break;
      }
    }

    // Any task left in the graph that wasn't selected or explicitly blocked is skipped
    const selectedSet = new Set(selectedTasks.map(t => t._id.toString()));
    const blockedSet = new Set(blockedTasks.map(t => t._id.toString()));
    
    const skippedTasks = tasks.filter(t => 
      !selectedSet.has(t._id.toString()) && 
      !blockedSet.has(t._id.toString())
    );

    res.json({
      executionOrder,
      selectedTasks,
      blockedTasks,
      skippedTasks,
      totalPriorityScore,
      remainingHours
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error simulating execution', error: error.message });
  }
});

module.exports = router;