const express = require('express');
const router = express.Router();

const Project = require('../schemas/projects_schema');

// Create a new project
router.post('/', async (req, res) => {
    try {
        const newProject = new Project(req.body);
        await newProject.save();
        res.status(201).json(newProject);
    } catch(err){
        res.status(500).json({ message: err.message });
    }
});

// Get a specific project
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('createdBy').populate('SelectedHw.hw_id').populate('SelectedHw.selected_io_ids').populate('Hmi_id');
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a project
router.put('/:id', async (req, res) => {
    try {
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(updatedProject);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a project
router.delete('/:id', async (req, res) => {
    try {
        const deletedProject = await Project.findByIdAndDelete(req.params.id);
        if (!deletedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;