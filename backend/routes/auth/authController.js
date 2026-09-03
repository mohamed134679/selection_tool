// authController.js
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} from '../utils/tokens.js'

const REFRESH_COOKIE_NAME = 'refreshToken'

export async function register(req, res) {
  const { username, password, accountType } = req.body

  const existingUser = await User.findOne({ username })
  if (existingUser) {
    return res.status(409).json({ message: 'Username already exists' })
  }

  const password_hash = await bcrypt.hash(password, 10)

  const user = await User.create({
    username,
    password_hash,
    accountType: accountType || 'employee',
  })

  // Partner approval isn't required yet — everyone gets instant access.
  // If that changes later, this is the one place to gate it: create the
  // user with status: 'pending' for partners and return 202 instead of
  // issuing tokens below.

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions())

  res.status(201).json({
    message: 'Account created',
    accessToken,
    user,
  })
}

export async function login(req, res) {
  const { username, password } = req.body

  const user = await User.findOne({ username })

  // Compare against a dummy hash even when no user is found, so response
  // timing doesn't reveal whether a username is registered.
  const passwordHash = user?.password_hash || '$2a$10$invalidsaltinvalidsaltinvalidsal'
  const passwordMatches = await bcrypt.compare(password, passwordHash)

  if (!user || !passwordMatches) {
    return res.status(401).json({ message: 'Invalid username or password' })
  }

  if (user.status !== 'active') {
    return res.status(403).json({ message: 'This account is not yet active' })
  }

  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user)

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions())

  res.status(200).json({
    message: 'Login successful',
    accessToken,
    user,
  })
}

export async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME]

  if (!token) {
    return res.status(401).json({ message: 'No refresh token' })
  }

  try {
    const payload = verifyRefreshToken(token)
    const user = await User.findById(payload.sub)

    if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ message: 'Refresh token no longer valid' })
    }

    const accessToken = signAccessToken(user)
    res.status(200).json({ accessToken, user })
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

export async function logout(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME]

  if (token) {
    try {
      const payload = verifyRefreshToken(token)
      // Bump the token version so this refresh token (and any other
      // outstanding ones) can no longer be used.
      await User.findByIdAndUpdate(payload.sub, { $inc: { refreshTokenVersion: 1 } })
    } catch {
      // token already invalid/expired — nothing to revoke
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth/refresh' })
  res.status(200).json({ message: 'Logged out' })
}

export async function me(req, res) {
  res.status(200).json({ user: req.user })
}