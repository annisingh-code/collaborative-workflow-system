// BUILD GRAPH
exports.buildGraph = (tasks) => {
  const adjList = {};

  const inDegree = {};

  const taskMap = {};

  // Initialize graph
  tasks.forEach((task) => {
    const id = task._id.toString();

    adjList[id] = [];

    inDegree[id] = 0;

    taskMap[id] = task;
  });

  // Build edges
  tasks.forEach((task) => {
    const taskId = task._id.toString();

    task.dependencies.forEach(
      (dependency) => {
        const depId =
          dependency.toString();

        if (adjList[depId]) {
          adjList[depId].push(
            taskId
          );

          inDegree[taskId]++;
        }
      }
    );
  });

  return {
    adjList,
    inDegree,
    taskMap
  };
};

// DETERMINISTIC SORTING
exports.sortTasks = (a, b) => {
  // Higher priority first
  if (b.priority !== a.priority) {
    return b.priority - a.priority;
  }

  // Lower estimated hours first
  if (
    a.estimatedHours !==
    b.estimatedHours
  ) {
    return (
      a.estimatedHours -
      b.estimatedHours
    );
  }

  // Earlier creation first
  return (
    new Date(a.createdAt) -
    new Date(b.createdAt)
  );
};