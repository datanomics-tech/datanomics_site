// Create an admin, or reset an existing admin's password.
// Usage: npm run admin:create -- "Full Name" email@example.com "StrongPassword123"
//    or set ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in .env and run: npm run admin:create
import bcrypt from "bcryptjs";
import { pool, q, one } from "../src/db.js";

const [name = process.env.ADMIN_NAME || "Administrator", email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD] = process.argv.slice(2);
if (!email || !pw) { console.error("Provide an email and password."); process.exit(1); }
if (pw.length < 10) { console.error("Password must be at least 10 characters."); process.exit(1); }

const hash = await bcrypt.hash(pw, 12);
const existing = await one("SELECT id FROM admins WHERE email = ?", [email.toLowerCase()]);
if (existing) {
  await q("UPDATE admins SET password_hash = ?, name = ? WHERE id = ?", [hash, name, existing.id]);
  console.log(`✓ Password reset for ${email}`);
} else {
  await q("INSERT INTO admins (name, email, password_hash) VALUES (?,?,?)", [name, email.toLowerCase(), hash]);
  console.log(`✓ Admin created: ${email}`);
}
await pool.end();
