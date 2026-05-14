const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: Number, min: 1, max: 5, required: true },
  estimatedHours: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Running', 'Completed', 'Failed', 'Blocked'],
    default: 'Pending'
  },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  resourceTag: { type: String, default: 'general' },
  maxRetries: { type: Number, default: 0 },
  retryCount: { type: Number, default: 0 },
  versionNumber: { type: Number, default: 1 },
  versionHistory: [
    {
      title: String,
      description: String,
      status: String,
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

taskSchema.index({ projectId: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema);