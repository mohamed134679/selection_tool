// Project — rebuilt to match new spec (HMI kept, licence untouched)
const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  HMI: { type: String },
  number_of_hw: { type: Number },
SelectedHw: [{
    hw_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hardware' },
    quantity: { type: Number },
    selected_io_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Io' }],
    ioPoints: { type: Number },
    refNumber: { type: String }   // NEW
}],
  Hmi_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hmi' },
  licences: {
    buildTime: {
      wanted: { type: Boolean, default: false },
      tier: { type: String, enum: ['Standard', 'Professional'] },
      addons: [{ type: String, enum: ['High Availability', 'Asset Link', 'Procedural Libraries'] }]
    },
    runtime: {
      ioPoints: { type: Number }
    },
    orchestration: {
      nodeCount: { type: Number }
    },
    communication: {
      protocols: [{ type: String, enum: ['Profinet', 'IEC 61850', 'OPC UA as a client'] }]
    }
  }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;