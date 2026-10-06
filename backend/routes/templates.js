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

function saveImportedImage(imageData) {
  if (!imageData) return null;
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(imageData);
  if (!match) throw new Error('Imported worksheet image must be a PNG, JPEG, JPG, or WebP image');
  const extension = match[1] === 'image/png' ? 'png' : match[1] === 'image/webp' ? 'webp' : 'jpg';
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) throw new Error('Imported worksheet image exceeds the 5MB limit');
  const filename = `import-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/templates/${filename}`;
}

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

// POST /templates/import — import one manual template per worksheet.
router.post('/import', requireAuth, requireAdmin, async (req, res) => {
  const { sheets } = req.body;
  if (!Array.isArray(sheets) || sheets.length === 0) {
    return res.status(400).json({ message: 'At least one worksheet is required' });
  }

  const invalidSheet = sheets.find((sheet) => (
    !sheet || typeof sheet.name !== 'string' || !sheet.name.trim()
    || !['standalone', 'redundant'].includes(sheet.category)
    || !Array.isArray(sheet.items)
    || (sheet.imageData != null && typeof sheet.imageData !== 'string')
  ));
  if (invalidSheet) {
    return res.status(400).json({ message: 'Each worksheet needs a name, category, and items list' });
  }

  const templates = await Template.insertMany(sheets.map((sheet) => ({
    name: sheet.name.trim(),
    description: sheet.description || '',
    category: sheet.category,
    sourceType: 'manual',
    imageUrl: saveImportedImage(sheet.imageData),
    items: sheet.items.map((item) => ({
      reference: String(item.reference || '').trim(),
      description: String(item.description || '').trim(),
      quantity: Math.max(1, Number(item.quantity) || 1),
    })),
    createdBy: req.user?._id ?? null,
  })));

  res.status(201).json(templates);
});

// POST /templates — admin only
router.post('/', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  const { name, description, category, sourceType, items, SelectedHw, Hmi_id, hmiUsesControlHw, hmiDisabled, hmiRefNumber, licences } = req.body;
  if (!name || !category) {
    return res.status(400).json({ message: 'name and category are required' });
  }

  const template = await Template.create({
    name,
    description: description ?? '',
    category,
    sourceType: sourceType === 'manual' ? 'manual' : 'wizard',
    imageUrl: req.file ? `/uploads/templates/${req.file.filename}` : null,
    items: items ? JSON.parse(items) : [],
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

// PUT /templates/:id — admin only
router.put('/:id', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  const { name, description, category, sourceType, items, SelectedHw, Hmi_id, hmiUsesControlHw, hmiDisabled, hmiRefNumber, licences } = req.body;
  if (!name || !category) {
    return res.status(400).json({ message: 'name and category are required' });
  }

  const updates = {
    name,
    description: description ?? '',
    category,
    sourceType: sourceType === 'manual' ? 'manual' : 'wizard',
    items: items ? JSON.parse(items) : [],
    SelectedHw: SelectedHw ? JSON.parse(SelectedHw) : [],
    Hmi_id: Hmi_id || null,
    hmiUsesControlHw: hmiUsesControlHw === 'true',
    hmiDisabled: hmiDisabled === 'true',
    hmiRefNumber: hmiRefNumber || null,
    licences: licences ? JSON.parse(licences) : undefined,
  };
  if (req.file) {
    updates.imageUrl = `/uploads/templates/${req.file.filename}`;
  }

  const updated = await Template.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ message: 'Template not found' });
  res.json(updated);
});

// DELETE /templates/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await Template.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;