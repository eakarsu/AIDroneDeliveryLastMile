'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken, requireCommander } = require('../middleware/auth');
const pool = require('../config/database');
const { verifyPassword } = require('../services/passwords');

const router = express.Router();

router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (!email.includes('@') || email.length > 150 || typeof password !== 'string' || password.length > 1024) {
    return res.status(400).json({ error: 'Valid email and password are required' });
  }
  try {
    const result = await pool.query(
      `SELECT id, tenant_id, email, password_hash, name, role
         FROM users WHERE email = $1 AND tenant_id IS NOT NULL LIMIT 1`,
      [email]
    );
    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const claims = { id: user.id, tenant_id: user.tenant_id, email: user.email, name: user.name, role: user.role };
    const token = jwt.sign(claims, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: claims });
  } catch (error) {
    console.error('Login unavailable:', error.message);
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }
});

router.get('/me', authenticateToken, (req, res) => res.json(req.user));
router.get('/users', authenticateToken, requireCommander, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE tenant_id = $1 ORDER BY id ASC',
      [req.user.tenant_id]
    );
    return res.json(result.rows);
  } catch (_) { return res.status(500).json({ error: 'Unable to list users' }); }
});

module.exports = router;
