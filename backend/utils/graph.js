const Task = require('../models/Task');

/**
 * Detects whether updating a task's dependencies
 * would create a circular dependency.
 *
 * Approach:
 * - Build dependency graph in memory
 * - Simulate new dependency update
 * - Run DFS cycle detection
 */

async function hasCycle(
  projectId,
  taskId,
  newDependencies
) {
  // Fetch all project tasks
  const tasks = await Task.find({
    projectId
  }).lean();

  // Build adjacency list
  const graph = {};

  tasks.forEach((task) => {
    graph[task._id.toString()] =
      task.dependencies.map((dep) =>
        dep.toString()
      );
  });

  // Simulate updated dependencies
  graph[taskId.toString()] =
    newDependencies.map((dep) =>
      dep.toString()
    );

  // Prevent direct self dependency
  if (
    newDependencies
      .map((id) => id.toString())
      .includes(taskId.toString())
  ) {
    return true;
  }

  // DFS tracking sets
  const visited = new Set();

  const recursionStack = new Set();

  // Depth First Search
  function dfs(node) {
    // Cycle detected
    if (recursionStack.has(node)) {
      return true;
    }

    // Already validated
    if (visited.has(node)) {
      return false;
    }

    visited.add(node);

    recursionStack.add(node);

    const dependencies =
      graph[node] || [];

    for (const dependency of dependencies) {
      if (dfs(dependency)) {
        return true;
      }
    }

    // Backtrack
    recursionStack.delete(node);

    return false;
  }

  // Start DFS from updated task
  return dfs(taskId.toString());
}

module.exports = {
  hasCycle
};