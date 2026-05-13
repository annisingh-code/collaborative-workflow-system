const Task = require('../models/Task');

/**
 * Checks if adding newDependencies to taskId creates a circular dependency.
 * Uses Depth-First Search (DFS) on an Adjacency List.
 */
async function hasCycle(projectId, taskId, newDependencies) {
    // 1. Fetch all tasks for this project to build an in-memory graph
    const tasks = await Task.find({ projectId }).lean();

    // 2. Build the adjacency list (Map node -> [dependencies])
    const graph = {};
    tasks.forEach(t => {
        graph[t._id.toString()] = t.dependencies.map(d => d.toString());
    });

    // 3. Simulate the update by applying the new dependencies temporarily
    graph[taskId.toString()] = newDependencies.map(d => d.toString());

    // 4. DFS tracking sets
    const visited = new Set();
    const recursionStack = new Set();

    function dfs(node) {
        if (recursionStack.has(node)) return true; // We hit a node currently in our path = CYCLE
        if (visited.has(node)) return false; // Already validated this node previously

        visited.add(node);
        recursionStack.add(node);

        const deps = graph[node] || [];
        for (let dep of deps) {
            if (dfs(dep)) return true; // Recursive check
        }

        recursionStack.delete(node); // Backtrack
        return false;
    }

    // We only need to start the check from the task being updated
    return dfs(taskId.toString());
}

module.exports = { hasCycle };