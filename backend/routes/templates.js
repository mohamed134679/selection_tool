// backend/routes/templates.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Template } = require('../schemas');
console.log('Template loaded:', typeof Template, Template?.modelName);
const { requireAuth, requireAdmin } = require('./auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'templates');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

// GET /templates?category=standalone
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  const templates = await Template.find(filter).sort({ createdAt: -1 });
  res.json(templates);
});

// GET /templates/:id
router.get('/:id', requireAuth, async (req, res) => {
  const template = await Template.findById(req.params.id);
  if (!template) return res.status(404).json({ message: 'Template not found' });
  res.json(template);
});

// POST /templates — admin only
router.post('/', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  const { name, description, category, SelectedHw, Hmi_id, hmiUsesControlHw, hmiDisabled, hmiRefNumber, licences } = req.body;
  if (!name || !category) {
    return res.status(400).json({ message: 'name and category are required' });
  }

  const template = await Template.create({
    name,
    description: description ?? '',
    category,
    imageUrl: req.file ? `/uploads/templates/${req.file.filename}` : null,
    SelectedHw: SelectedHw ? JSON.parse(SelectedHw) : [],
    Hmi_id: Hmi_id || null,
    hmiUsesControlHw: hmiUsesControlHw === 'true',
    hmiDisabled: hmiDisabled === 'true',
    hmiRefNumber: hmiRefNumber || null,
    licences: licences ? JSON.parse(licences) : undefined,
    createdBy: req.user?._id ?? null,
  });

  res.status(201).json(template);
});

// DELETE /templates/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await Template.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;