const USERNAME_RE = /^[a-zA-Z0-9._-]{3,50}$/;
// At least 8 chars, one uppercase, one lowercase, one number
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateRegister(req, res, next) {
  const { username, password, accountType } = req.body;

  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return res.status(400).json({
      message: 'Username must be 3-50 characters (letters, numbers, dots, dashes, underscores only)',
    });
  }

  if (typeof password !== 'string' || !PASSWORD_RE.test(password)) {
    return res.status(400).json({
      message:
        'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number',
    });
  }

  if (accountType && !['employee', 'partner'].includes(accountType)) {
    return res.status(400).json({ message: 'Invalid account type' });
  }

  next();
}

function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid input' });
  }

  next();
}

module.exports = { validateRegister, validateLogin };