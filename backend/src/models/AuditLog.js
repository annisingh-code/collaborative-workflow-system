const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'TASK_UPDATED', 'TASK_CREATED'
  entity: { type: String, required: true }, // e.g., 'Task', 'Project'
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  metadata: { type: Object } // Store what changed
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);