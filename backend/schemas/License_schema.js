const mongoose = require("mongoose");
const licenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  reference_no: { type: String, required: true },
  description: { type: String },
});

const License = mongoose.model("License", licenseSchema);

module.exports = License;