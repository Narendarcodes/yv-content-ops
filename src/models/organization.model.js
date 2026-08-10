const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    settings: { type: Object, default: {} },
  },
  { timestamps: true }
);

const Organization = mongoose.model('Organization', OrganizationSchema);
module.exports = Organization;
