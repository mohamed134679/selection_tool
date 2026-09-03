const express = require('express');
const router = express.Router();

const hmi = require('../schemas/Hmi_schema');
const { requireAuth, requireAdmin } = require('./auth');

router.get('/', async (req, res) => {
    try {
        const hmiList = await hmi.find();
        res.json(hmiList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin only below
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const newHmi = new hmi(req.body);
        await newHmi.save();
        res.status(201).json(newHmi);
    } catch(err){
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const updated = await hmi.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updated) {
            return res.status(404).json({ message: 'HMI not found' });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const deleted = await hmi.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'HMI not found' });
        }
        res.json({ message: 'HMI deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;