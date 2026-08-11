const express = require('express');
const router = express.Router();

const Io = require('../schemas/IO_schema');

//create a new IO entry
router.post('/', async (req, res) => {
    try {
        const newIo = new Io(req.body);
        await newIo.save();
        res.status(201).json(newIo);
    } catch(err){
        res.status(500).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const ioList = await Io.find();
        res.json(ioList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updated = await Io.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updated) {
            return res.status(404).json({ message: 'IO not found' });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
