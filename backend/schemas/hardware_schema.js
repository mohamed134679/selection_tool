
// Devices (Hardware catalog) — Port_no/image/license unchanged, licence field left as-is
const mongoose = require('mongoose');
const hardwareSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Port_no: { type: Number },
  image: { type: String },
  compatible_io: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Io' }],
  license: { type: mongoose.Schema.Types.ObjectId, ref: 'License' }
});
const Hardware = mongoose.model('Hardware', hardwareSchema);
module.exports = Hardware;