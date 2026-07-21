'use strict';

const pool = require('../config/database');
const { hashPassword } = require('../services/passwords');

async function main() {
  const explicitlyAllowed = process.env.ALLOW_BOOTSTRAP_ADMIN === '1'
    || process.env.BOOTSTRAP_ACKNOWLEDGEMENT === 'create-initial-admin';
  if (!explicitlyAllowed) {
    throw new Error('Set ALLOW_BOOTSTRAP_ADMIN=1 for this explicit operation');
  }

  const tenant = process.env.BOOTSTRAP_TENANT_ID
    || process.env.GOVERNANCE_TENANT_ID
    || process.env.TENANT_ID;
  const email = String(process.env.BOOTSTRAP_EMAIL
    || process.env.BOOTSTRAP_ADMIN_EMAIL
    || process.env.PROVISION_ADMIN_EMAIL
    || '').toLowerCase();
  const password = process.env.BOOTSTRAP_PASSWORD
    || process.env.BOOTSTRAP_ADMIN_PASSWORD
    || process.env.PROVISION_ADMIN_PASSWORD;
  if (!tenant || !email || !password) {
    throw new Error('Bootstrap tenant, email and password are required');
  }

  const found = await pool.query('SELECT id FROM users WHERE tenant_id=$1', [tenant]);
  if (found.rows.length) throw new Error('Tenant already has users; bootstrap will not overwrite');
  await pool.query(
    'INSERT INTO users(email,name,role,tenant_id,password_hash) VALUES($1,$2,$3,$4,$5)',
    [email, process.env.BOOTSTRAP_NAME || process.env.BOOTSTRAP_ADMIN_NAME || 'Bootstrap Admin', 'admin', tenant, hashPassword(password)]
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
