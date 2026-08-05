require('dotenv').config();

const express = require('express');

// Small polyfill to automatically forward rejected promises from
// async route handlers to Express error middleware. This replaces
// the express-async-errors package which expects Express 4.x.
const originalRouter = express.Router;
express.Router = function (...args) {
  const router = originalRouter(...args);
  const methods = [
    'get',
    'post',
    'put',
    'delete',
    'patch',
    'options',
    'head',
    'all',
    'use',
  ];

  methods.forEach((method) => {
    const original = router[method];
    router[method] = function (...handlers) {
      const wrapped = handlers.map((h) => {
        if (typeof h === 'function' && h.constructor.name === 'AsyncFunction') {
          return function (req, res, next) {
            Promise.resolve(h(req, res, next)).catch(next);
          };
        }
        return h;
      });
      return original.apply(this, wrapped);
    };
  });

  return router;
};
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true, // required so the browser sends/receives the refresh cookie
  })
);

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Connect to MongoDB
const seedHardware = require('./Seeder/hardwareSeeder');

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selection_tool_DB')
  .then(async () => {
    console.log('MongoDB connected');
    await seedHardware();
  })
  .catch((err) => console.log(err));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
const authRoutes = require('./routes/auth');
const ioRoutes = require('./routes/io');
const hmiRoutes = require('./routes/hmi');
const projectRoutes = require('./routes/project');
const hardwareRoutes = require('./routes/hardware');

app.use('/auth', authRoutes);
app.use('/io', ioRoutes);
app.use('/hmi', hmiRoutes);
app.use('/projects', projectRoutes);
app.use('/hardware', hardwareRoutes);

// Catch anything thrown in async route handlers that wasn't already
// caught locally, so the process doesn't crash on an unhandled rejection
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// const seedHardware = require('./Seeder/hardwareSeeder');

module.exports = require('./schemas');