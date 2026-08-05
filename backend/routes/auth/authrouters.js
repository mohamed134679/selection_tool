import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, refresh, logout, me } from '../authController.js'
import { validateRegister, validateLogin } from '../validators.js'
import { requireAuth } from '../auth.js'

const router = Router()

// Slow down brute-force attempts on login specifically
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/register', validateRegister, register)
router.post('/login', loginLimiter, validateLogin, login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router