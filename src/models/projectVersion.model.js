const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    storageRef: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const ProjectVersionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
    versionNumber: { type: Number, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Object, default: {} },
    changeSummary: { type: String, default: '' },
    files: { type: [FileSchema], default: [] },
  },
  { timestamps: true }
);

ProjectVersionSchema.index({ projectId: 1, versionNumber: 1 }, { unique: true });

const ProjectVersion = mongoose.model('ProjectVersion', ProjectVersionSchema);
module.exports = ProjectVersion;
