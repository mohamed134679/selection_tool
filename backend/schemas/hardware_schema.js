const mongoose = require('mongoose');

// A device often ships as several ordering variants (e.g. Standard vs
// Professional, Standalone vs Redundant) — each with its own part number.
const partNumberSchema = new mongoose.Schema({
  code: { type: String, required: true },   // e.g. "BMEDP592020"
  label: { type: String }                    // e.g. "M590d Standard Standalone"
}, { _id: false });

// Spec sheets group bullet points under headings (e.g. "RTU Side Features",
// "Modicon TM3 IO") rather than one flat list — keep that structure instead
// of flattening it, since it's meaningful to the reader.
const featureGroupSchema = new mongoose.Schema({
  title: { type: String },   // e.g. "Edge OS side Features" — omit for a single ungrouped list
  items: [{ type: String }]
}, { _id: false });

const hardwareSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true
  },

  // New descriptive/catalog fields
  family: { type: String },                 // e.g. "ID-PAC"
  range: { type: String, default: 'EcoStruxure Automation Expert' },
  version: { type: String },                // e.g. "V26.0" — the badge shown on the spec sheet
  regionRestriction: { type: String },      // e.g. "China only" — omit when generally available

  type: {
    type: String,
    required: true,
    enum: ['SoftdPAC', 'IEC61499', '3rd Party']
  },

  // Legacy field, kept for backward compatibility with existing documents/wizard code
  Port_no: {
    type: Number
  },

  image: {
    type: String
  },

  description: {
    type: String
  },

  partNumbers: [partNumberSchema],
  featureGroups: [featureGroupSchema],
  notes: [{ type: String }],   // footnotes / important compatibility warnings

  tags: [{
    type: String
  }],

  compatible_io: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Io'
  }],

  license: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'License'
  }
}, { timestamps: true });

module.exports = mongoose.model('Hardware', hardwareSchema);