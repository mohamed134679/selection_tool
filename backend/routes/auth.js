const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { User } = require('../schemas');
const { validateRegister, validateLogin } = require('./auth/validator');
const { verifyAccessToken } = require('../utils/tokens');

// Basic auth middleware: verifies Bearer access token and attaches `req.user`.
async function requireAuth(req, res, next) {
  const auth = req.headers?.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = auth.slice(7);
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} = require('../utils/tokens');

const router = express.Router();
const REFRESH_COOKIE_NAME = 'refreshToken';

// Slow down brute-force attempts on login specifically
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validateRegister, async (req, res) => {
  const { username, password, accountType } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password_hash,
    accountType: accountType || 'employee',
  });

  // Partner approval isn't required yet — everyone gets instant access.
  // To gate this later: create partner accounts with status: 'pending'
  // and return 202 instead of issuing tokens below.

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  res.status(201).json({
    message: 'User registered successfully',
    accessToken,
    user,
  });
});

router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  // Compare against a dummy hash even when no user is found, so response
  // timing doesn't reveal whether a username is registered.
  const passwordHash = user?.password_hash || '$2a$10$invalidsaltinvalidsaltinvalidsal';
  const passwordMatches = await bcrypt.compare(password, passwordHash);

  if (!user || !passwordMatches) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ message: 'This account is not yet active' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  res.status(200).json({
    message: 'Login successful',
    accessToken,
    user,
  });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);

    if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ message: 'Refresh token no longer valid' });
    }

    const accessToken = signAccessToken(user);
    res.status(200).json({ accessToken, user });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      // Bump the token version so this refresh token (and any other
      // outstanding ones) can no longer be used.
      await User.findByIdAndUpdate(payload.sub, { $inc: { refreshTokenVersion: 1 } });
    } catch {
      // token already invalid/expired — nothing to revoke
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth/refresh' });
  res.status(200).json({ message: 'Logged out' });
});

router.get('/me', requireAuth, async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;
// Also expose the middleware itself (as a property on the router function)
// so other route files can do: const { requireAuth } = require('./auth');
module.exports.requireAuth = requireAuth;
