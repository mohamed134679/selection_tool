const express = require('express');
const router = express.Router();
const Project = require('../schemas/projects_schema');
const { requireAuth, requireAdmin } = require('./auth');

// List all projects for review (admin only). Optional ?status=pending|needs_edit|approved
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.reviewStatus = req.query.status;
    }
    const projects = await Project.find(filter)
      .populate('createdBy')
      .populate('Hmi_id')
      .populate('SelectedHw.hw_id')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single project for review (admin only — bypasses the owner-only
// restriction that routes/projects.js enforces for regular users)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy')
      .populate('Hmi_id')
      .populate('SelectedHw.hw_id')
      .populate('SelectedHw.selected_io_ids');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve or request edits on a project (admin only)
router.patch('/:id/review', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { action, comment } = req.body;
    if (!['approve', 'request_edit'].includes(action)) {
      return res.status(400).json({ message: 'action must be "approve" or "request_edit"' });
    }
    if (action === 'request_edit' && !comment) {
      return res.status(400).json({ message: 'A comment is required when requesting edits.' });
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {
        reviewStatus: action === 'approve' ? 'approved' : 'needs_edit',
        reviewComment: action === 'approve' ? '' : comment,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy')
      .populate('Hmi_id')
      .populate('SelectedHw.hw_id');

    if (!updated) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;