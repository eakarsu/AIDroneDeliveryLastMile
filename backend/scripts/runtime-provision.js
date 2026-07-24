'use strict';

const pool = require('../config/database');
const { hashPassword } = require('../services/passwords');

async function main() {
  const tenant = process.env.GOVERNANCE_TENANT_ID || process.env.TENANT_ID || process.env.BOOTSTRAP_TENANT_ID;
  const email = String(process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!tenant || !email || !password || password.length < 12) {
    throw new Error('Tenant, PROVISION_ADMIN_EMAIL, and a password of at least 12 characters are required');
  }
  await pool.query(
    `INSERT INTO users (email, name, role, tenant_id, password_hash)
     VALUES ($1, $2, 'admin', $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, role = 'admin', tenant_id = EXCLUDED.tenant_id,
           password_hash = EXCLUDED.password_hash`,
    [email, 'Runtime Administrator', tenant, hashPassword(password)]
  );
  await pool.end();
}

main().catch((error) => {
  console.error(`Runtime administrator provisioning failed: ${error.message}`);
  process.exitCode = 1;
});
