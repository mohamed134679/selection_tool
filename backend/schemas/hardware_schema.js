const mongoose = require('mongoose');

const hardwareSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true
  },

  type: {
    type: String,
    required: true,
    enum: ['SoftdPAC', 'IEC61499', '3rd Party']
  },

  Port_no: {
    type: Number
  },

  image: {
    type: String
  },

  description: {
    type: String
  },

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
});

module.exports = mongoose.model('Hardware', hardwareSchema);