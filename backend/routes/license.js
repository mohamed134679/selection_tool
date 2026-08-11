const express = require("express");
const router = express.Router();
const License = require("../schemas/License_schema");

// Create a new license
router.post("/", async (req, res) => {
  try {
    const newLicense = new License(req.body);
    await newLicense.save();
    res.status(201).json(newLicense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all licenses
router.get("/", async (req, res) => {
  try {
    const licenses = await License.find();
    res.json(licenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific license
router.get("/:id", async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ message: "License not found" });
    }
    res.json(license);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a license
router.put("/:id", async (req, res) => {
  try {
    const updatedLicense = await License.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedLicense) {
      return res.status(404).json({ message: "License not found" });
    }
    res.json(updatedLicense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;