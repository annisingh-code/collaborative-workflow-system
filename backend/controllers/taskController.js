const Task = require('../models/Task');

const AuditLog = require('../models/AuditLog');

// Graph utility
let hasCycle;

try {
    hasCycle =
        require('../utils/graph').hasCycle;
} catch (e) {
    console.warn(
        'Graph utility not found.'
    );

    hasCycle = async () => false;
}

// CREATE TASK
exports.createTask = async (
    req,
    res
) => {
    try {
        const {
            title,
            description,
            priority,
            estimatedHours,
            dependencies,
            resourceTag,
            maxRetries
        } = req.body;

        const task = new Task({
            projectId: req.params.projectId,
            title,
            description,
            priority,
            estimatedHours,
            dependencies:
                dependencies || [],
            resourceTag,
            maxRetries: maxRetries || 3
        });

        await task.save();

        // Realtime task creation
        const io = req.app.get('io');

        if (io) {
            io.to(req.params.projectId).emit(
                'taskCreated',
                task
            );
        }

        // Audit log
        await AuditLog.create({
            actor: req.user.id,
            action: 'TASK_CREATED',
            entity: 'Task',
            entityId: task._id,
            metadata: {
                title: task.title,
                status: task.status,
                version:
                    task.versionNumber
            }
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({
            message: `Creation Error: ${error.message}`
        });
    }
};

// GET TASKS
exports.getTasks = async (
    req,
    res
) => {
    try {
        const tasks = await Task.find({
            projectId:
                req.params.projectId
        }).populate(
            'dependencies',
            'title status'
        );

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: `Fetch Error: ${error.message}`
        });
    }
};

// UPDATE TASK
exports.updateTask = async (
    req,
    res
) => {
    try {
        const { taskId, projectId } =
            req.params;

        const updateData = req.body;

        const incomingVersion =
            updateData.versionNumber;

        // Optimistic concurrency validation
        if (!incomingVersion) {
            return res.status(400).json({
                message:
                    'versionNumber is required for updates'
            });
        }

        // Existing task
        const existingTask =
            await Task.findById(taskId);

        if (!existingTask) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        // Execution constraints
        if (
            updateData.status ===
            'Running'
        ) {
            const taskToCheck =
                await Task.findById(taskId)
                    .populate(
                        'dependencies'
                    );

            // Dependency completion check
            const incompleteDeps =
                taskToCheck.dependencies.filter(
                    (dep) =>
                        dep.status !==
                        'Completed'
                );

            if (
                incompleteDeps.length > 0
            ) {
                return res.status(400).json({
                    message:
                        'Cannot start task until dependencies are completed'
                });
            }

            // Resource locking check
            if (
                taskToCheck.resourceTag
            ) {
                const runningTask =
                    await Task.findOne({
                        projectId,
                        status: 'Running',
                        resourceTag:
                            taskToCheck.resourceTag,
                        _id: {
                            $ne: taskId
                        }
                    });

                if (runningTask) {
                    return res.status(400).json({
                        message:
                            'Another task is already using this resource'
                    });
                }
            }
        }

        // Dependency cycle detection
        if (
            updateData.dependencies &&
            updateData.dependencies
                .length > 0
        ) {
            const cycleExists =
                await hasCycle(
                    projectId,
                    taskId,
                    updateData.dependencies
                );

            if (cycleExists) {
                return res.status(400).json({
                    message:
                        'Circular dependency detected'
                });
            }
        }

        delete updateData.versionNumber;

        // Optimistic concurrency update
        const updatedTask =
            await Task.findOneAndUpdate(
                {
                    _id: taskId,
                    versionNumber:
                        incomingVersion
                },
                {
                    ...updateData,
                    $inc: {
                        versionNumber: 1
                    }
                },
                { new: true }
            );

        // Conflict detection
        if (!updatedTask) {
            const latestTask =
                await Task.findById(taskId);

            return res.status(409).json({
                message:
                    'Task was updated by another user',
                latestData: latestTask
            });
        }

        // Audit log
        await AuditLog.create({
            actor: req.user.id,
            action: 'TASK_UPDATED',
            entity: 'Task',
            entityId: updatedTask._id,
            metadata: {
                previousStatus:
                    existingTask.status,
                newStatus:
                    updatedTask.status,
                previousVersion:
                    incomingVersion,
                newVersion:
                    updatedTask.versionNumber
            }
        });

        // Realtime update
        const io = req.app.get('io');

        if (io) {
            io.to(projectId).emit(
                'taskUpdated',
                updatedTask
            );
        }

        res.json(updatedTask);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message
        });
    }
};

// DELETE TASK
exports.deleteTask = async (
    req,
    res
) => {
    try {
        const deletedTask =
            await Task.findOneAndDelete({
                _id: req.params.taskId,
                projectId:
                    req.params.projectId
            });

        if (!deletedTask) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        // Remove deleted task from dependencies
        await Task.updateMany(
            {
                projectId:
                    req.params.projectId
            },
            {
                $pull: {
                    dependencies:
                        req.params.taskId
                }
            }
        );

        // Audit log
        await AuditLog.create({
            actor: req.user.id,
            action: 'TASK_DELETED',
            entity: 'Task',
            entityId: deletedTask._id,
            metadata: {
                title: deletedTask.title
            }
        });

        res.json({
            message:
                'Task deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message:
                'Error deleting task'
        });
    }
};

// TASK HISTORY
exports.getTaskHistory =
    async (req, res) => {
        try {
            const history =
                await AuditLog.find({
                    entity: 'Task',
                    entityId:
                        req.params.taskId
                })
                    .sort({
                        createdAt: -1
                    })
                    .populate(
                        'actor',
                        'name email'
                    );

            res.json(history);
        } catch (error) {
            res.status(500).json({
                message:
                    'Error fetching history'
            });
        }
    };

// RETRY TASK
exports.retryTask = async (
    req,
    res
) => {
    try {
        const task =
            await Task.findById(
                req.params.taskId
            );

        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        if (
            task.status !== 'Failed'
        ) {
            return res.status(400).json({
                message:
                    'Only failed tasks can be retried'
            });
        }

        if (
            task.retryCount >=
            task.maxRetries
        ) {
            return res.status(400).json({
                message:
                    'Maximum retry limit exceeded'
            });
        }

        task.status = 'Pending';

        task.retryCount += 1;

        task.versionNumber += 1;

        await task.save();

        // Audit log
        await AuditLog.create({
            actor: req.user.id,
            action: 'TASK_RETRIED',
            entity: 'Task',
            entityId: task._id,
            metadata: {
                retryCount:
                    task.retryCount,
                version:
                    task.versionNumber
            }
        });

        res.json(task);
    } catch (error) {
        res.status(500).json({
            message:
                'Error retrying task'
        });
    }
};