const express = require('express');
const router = express.Router();

const hmi = require('../schemas/Hmi_schema');

//create a new HMI entry
router.post('/', async (req, res) => {
    try {
        const newHmi = new hmi(req.body);
        await newHmi.save();
        res.status(201).json(newHmi);
    } catch(err){
        res.status(500).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const hmiList = await hmi.find();
        res.json(hmiList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
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

module.exports = router;
