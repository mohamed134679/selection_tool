const jwt = require('jsonwebtoken');

function ensureJwtSecrets() {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is not configured. Set this env variable before starting the backend.');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured. Set this env variable before starting the backend.');
  }
}

function signAccessToken(user) {
  ensureJwtSecrets();
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function signRefreshToken(user) {
  ensureJwtSecrets();
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion: user.refreshTokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function verifyAccessToken(token) {
  ensureJwtSecrets();
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  ensureJwtSecrets();
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// Cookie options for the refresh token. httpOnly so client-side JS
// (and therefore any injected script) can never read it.
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — keep in sync with JWT_REFRESH_EXPIRES_IN
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshCookieOptions,
};