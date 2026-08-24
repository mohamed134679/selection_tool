const mongoose = require('mongoose');
const ioSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  partNumbers: [{
    code: { type: String, required: true },
    label: { type: String }
  }]
});

const Io = mongoose.model('Io', ioSchema);
module.exports = Io;