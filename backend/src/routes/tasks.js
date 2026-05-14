const express = require('express');
const Task = require('../models/Task');
const { hasCycle } = require('../utils/graph');
const auth = require('../middleware/auth');
const router = express.Router({ mergeParams: true }); // Allows access to projectId from parent router

// Create a new task
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, priority, estimatedHours, dependencies, resourceTag } = req.body;
        const projectId = req.params.projectId;

        const task = new Task({
            projectId,
            title,
            description,
            priority,
            estimatedHours,
            dependencies: dependencies || [],
            resourceTag
        });

        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating task', error: error.message });
    }
});

// Get all tasks for a project
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ projectId: req.params.projectId }).populate('dependencies', 'title status');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching tasks' });
    }
});

// Update a task (Handles Optimistic Concurrency & Cycle Detection)
router.put('/:taskId', auth, async (req, res) => {
    try {
        const { taskId, projectId } = req.params;
        const updateData = req.body;
        const incomingVersion = updateData.versionNumber;

        if (!incomingVersion) {
            return res.status(400).json({ message: 'versionNumber is required for updates' });
        }

        // 1. Dependency Validation (Cycle Detection)
        if (updateData.dependencies) {
            const cycleExists = await hasCycle(projectId, taskId, updateData.dependencies);
            if (cycleExists) {
                return res.status(400).json({ message: 'Update rejected: Circular dependency detected' });
            }
        }

        // 2. Optimistic Concurrency Control
        // We strictly match _id AND versionNumber. 
        // We increment the versionNumber automatically by 1.
        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, versionNumber: incomingVersion },
            { ...updateData, $inc: { versionNumber: 1 } },
            { new: true } // Returns the updated document
        );

        // If no document is found, it means the ID is wrong OR the version is stale.
        if (!updatedTask) {
            // Fetch latest to show the user what they missed
            const currentTask = await Task.findById(taskId);
            if (!currentTask) return res.status(404).json({ message: 'Task not found' });

            return res.status(409).json({
                message: 'Conflict: Task was modified by another user. Please refresh and try again.',
                latestData: currentTask
            });
        }

        // --- NEW PHASE 5 LOGIC STARTS HERE ---

        // 1. Audit Logging
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
            actor: req.user.id,
            action: 'TASK_UPDATED',
            entity: 'Task',
            entityId: updatedTask._id,
            metadata: { status: updatedTask.status, newVersion: updatedTask.versionNumber }
        });

        // 2. Real-Time WebSocket Emission
        // Grab 'io' from the app instance and broadcast to the specific project room
        const io = req.app.get('io');
        io.to(projectId).emit('taskUpdated', updatedTask);

        // 3. Webhook Integration (Trigger if Completed)
        if (updatedTask.status === 'Completed') {
            const { triggerWebhook } = require('../utils/webhook');
            // Hardcoded dummy URL for the assignment demonstration
            const dummyWebhookUrl = 'https://webhook.site/es-magico-demo';
            // Do not await this, let it run in the background!
            triggerWebhook(dummyWebhookUrl, { event: 'task_completed', task: updatedTask });
        }

        // --- NEW PHASE 5 LOGIC ENDS HERE ---

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating task', error: error.message });
    }
});





module.exports = router;