const express = require('express');
const router = express.Router();
const User = require('../schemas/users_schema');
const { requireAuth, requireAdmin } = require('./auth');

// List all users (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Promote or demote a user's role (admin only)
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'role must be "user" or "admin"' });
    }
    // Prevent an admin from demoting themselves and getting locked out
    // of the admin area mid-session.
    if (String(req.user._id) === String(req.params.id) && role !== 'admin') {
      return res.status(400).json({ message: "You can't remove your own admin access." });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a user account (admin only). Their existing projects are left in
// place rather than cascade-deleted — the review queue already falls back
// to "Unknown user" when createdBy no longer resolves, so nothing crashes,
// and destructively wiping someone's project history as a side effect of
// removing their account felt like the wrong default to assume silently.
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: "You can't delete your own account." });
    }
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;