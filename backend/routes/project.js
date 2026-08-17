const express = require('express');
const router = express.Router();

const Project = require('../schemas/projects_schema');
const { requireAuth } = require('./auth');

// Get the number of projects created by the currently logged-in user
router.get('/count', requireAuth, async (req, res) => {
    try {
        const total = await Project.countDocuments({ createdBy: req.user._id });
        res.json({ total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// List projects belonging to the currently logged-in user only
router.get('/', requireAuth, async (req, res) => {
    try {
        const projects = await Project.find({ createdBy: req.user._id })
            .populate('Hmi_id')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new project — requires a logged-in user; createdBy is taken from
// the verified access token, never from the client-supplied body, so a user
// can't create a project attributed to someone else.
router.post('/', requireAuth, async (req, res) => {
    try {
        const newProject = new Project({
            ...req.body,
            createdBy: req.user._id,
        });
        await newProject.save();
        res.status(201).json(newProject);
    } catch(err){
        res.status(500).json({ message: err.message });
    }
});

// Get a specific project — only its creator may view it
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('createdBy')
            .populate('SelectedHw.hw_id')
            .populate('SelectedHw.selected_io_ids')
            .populate('Hmi_id');
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (String(project.createdBy?._id || project.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You do not have access to this project' });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a project — only its creator may edit it
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const existing = await Project.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (String(existing.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You do not have access to this project' });
        }

        // createdBy is never editable via the client, regardless of what's sent
        const { createdBy, ...updates } = req.body;

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        res.json(updatedProject);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a project — only its creator may delete it
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const existing = await Project.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (String(existing.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You do not have access to this project' });
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;