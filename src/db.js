import mysql from "mysql2/promise";
import { config } from "./config.js";

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  dateStrings: false,
  multipleStatements: false
});

export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
export async function one(sql, params = []) {
  return (await q(sql, params))[0] || null;
}

// List fields are stored as JSON text; parse defensively (MySQL and MariaDB differ on JSON types).
export function list(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return String(v).split("\n").map(s => s.trim()).filter(Boolean); }
}
