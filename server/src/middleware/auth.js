const { verifyAccessToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const { User } = require('../models');

/**
 * Middleware: Verify JWT access token from Authorization header.
 * Attaches req.user with { id, email, role } on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) {
      return sendError(res, 'Access denied. User not found or deactivated.', 401);
    }

    req.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired.', 401);
    }
    return sendError(res, 'Invalid token.', 401);
  }
};

/**
 * Middleware factory: Restrict access to specific roles.
 * Usage: authorize('ADMIN', 'MANAGER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden. Insufficient permissions.', 403);
    }
    next();
  };
};

module.exports = { authenticate, authorize };
