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
    selected_io_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Io' }]
  }],
  Hmi_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hmi' }
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;