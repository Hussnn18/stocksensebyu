import jwt from 'jsonwebtoken';

/**
 * Protect a route: requires "Authorization: Bearer <token>" from /api/auth/login.
 * Sets req.user = { id, role }.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose) {
      // Password-reset tokens must not work as login tokens
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
  }
}

/** Allow only the given roles, e.g. requireRole('manager'). Use after requireAuth. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to do this.' });
    }
    next();
  };
}
