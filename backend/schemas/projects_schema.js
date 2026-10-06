const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdByUsername: { type: String, default: null },

  // "wizard" = built via /hardware → /hmi → /licence (structured catalog data below)
  // "manual" = created from a manual-entry template; a flat BOM list instead
  sourceType: { type: String, enum: ['wizard', 'manual'], default: 'wizard' },
  items: [{
    reference: { type: String, default: '' },
    description: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
  }],

  HMI: { type: String },
  number_of_hw: { type: Number },
  SelectedHw: [{
    hw_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hardware' },
    quantity: { type: Number },
    selected_io_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Io' }],
    ioPoints: { type: Number },
    refNumber: { type: String },
    attachmentUrl: { type: String },
    ioRefNumber: { type: String }
  }],
  Hmi_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hmi' },
  hmiUsesControlHw: { type: Boolean, default: false },
  hmiDisabled: { type: Boolean, default: false },
  hmiRefNumber: { type: String },
  licences: {
    buildTime: {
      wanted: { type: Boolean, default: false },
      tier: { type: String, enum: ['Standard', 'Professional'] },
      addons: [{ type: String, enum: ['High Availability', 'Asset Link', 'Procedural Libraries'] }]
    },
    runtime: { ioPoints: { type: Number } },
    orchestration: { nodeCount: { type: Number } },
    communication: { protocols: [{ type: String, enum: ['Profinet', 'IEC 61850', 'OPC UA as a client'] }] }
  },
  reviewStatus: { type: String, enum: ['pending', 'needs_edit', 'approved'], default: 'pending' },
  reviewComment: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;