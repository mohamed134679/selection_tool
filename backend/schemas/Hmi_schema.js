
// Devices (Hardware catalog) — Port_no/image/license unchanged, licence field left as-is
const mongoose = require('mongoose');
const HmiSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  image: { type: String },
});
const Hmi = mongoose.model('Hmi', HmiSchema);
module.exports = Hmi;