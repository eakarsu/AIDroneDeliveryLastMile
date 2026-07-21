const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || '';
if (JWT_SECRET.length < 32 || /change|replace|example|default/i.test(JWT_SECRET)) {
  throw new Error('JWT_SECRET must be a unique value of at least 32 characters');
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id || !decoded.tenant_id || !ROLES.includes(decoded.role)) {
      return res.status(401).json({ error: 'Token is missing required identity claims' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role hierarchy: admin > pilot > viewer
// admin:  full write access
// pilot:  write access (no user mgmt)
// viewer: read-only
const ROLES = ['viewer', 'pilot', 'admin'];

function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role || 'viewer';
    if (!allowed.includes(role)) {
      return res.status(403).json({
        error: `Forbidden: requires one of [${allowed.join(', ')}], got '${role}'`,
      });
    }
    next();
  };
}

// Convenience: any non-viewer write (admin or pilot)
const requireWriter = requireRole('admin', 'pilot');
// Convenience: admin-only
const requireCommander = requireRole('admin');

// Mounts auto-guards onto a CRUD router so GET stays open to all authenticated
// users while POST/PUT/DELETE require writer role. Use INSTEAD of writing
// per-route guards inside each routes/<name>.js file.
function withCrudRbac(router) {
  router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return requireWriter(req, res, next);
    }
    return next();
  });
  return router;
}

module.exports = {
  authenticateToken,
  JWT_SECRET,
  ROLES,
  requireRole,
  requireWriter,
  requireCommander,
  withCrudRbac,
};
