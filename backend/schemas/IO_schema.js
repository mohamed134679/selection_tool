// IO — added image field, license left as-is
const mongoose = require('mongoose');
const ioSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  image: { type: String }
});

const Io = mongoose.model('Io', ioSchema);
module.exports = Io;