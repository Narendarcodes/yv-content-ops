const mongoose = require('mongoose');

/**
 * Task — kanban-style work item scoped to a project (Fluit Tasks equivalent).
 * Statuses map to typical kanban columns: todo / in_progress / in_review / done.
 */
const TaskSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: '', maxlength: 10000 },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
      index: true,
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TaskSchema.index({ projectId: 1, status: 1, createdAt: 1 });
TaskSchema.index({ projectId: 1, assignee: 1, status: 1 });

const Task = mongoose.model('Task', TaskSchema);
module.exports = Task;
