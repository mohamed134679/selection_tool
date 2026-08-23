const express = require('express');
const router = express.Router();

const hardware = require('../schemas/hardware_schema');

router.get('/:id', async (req, res) => {
    try {
        const hardwareItem = await hardware.findById(req.params.id);
        if (!hardwareItem) {
            return res.status(404).json({ message: 'Hardware not found' });
        }
        res.json(hardwareItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const hardwareList = await hardware.find();

        res.json(hardwareList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/type/:type', async (req, res) => {
    try {
        const hardwareList = await hardware.find({
            type: req.params.type
        });

        res.json(hardwareList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// New: filter the catalog by family (e.g. "ID-PAC"), used by the
// read-only hardware overview/catalog page
router.get('/family/:family', async (req, res) => {
    try {
        const hardwareList = await hardware.find({
            family: req.params.family
        });

        res.json(hardwareList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const newHardware = new hardware(req.body);
        await newHardware.save();
        res.status(201).json(newHardware);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedHardware = await hardware.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedHardware) {
            return res.status(404).json({ message: 'Hardware not found' });
        }
        res.json(updatedHardware);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;