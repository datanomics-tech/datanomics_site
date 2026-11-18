import "dotenv/config";

const env = (k, d = "") => (process.env[k] ?? d).toString().trim();

export const config = {
  port: +env("PORT", "3000"),
  prod: env("NODE_ENV") === "production",
  siteUrl: env("SITE_URL", "http://localhost:3000").replace(/\/$/, ""),
  sessionSecret: env("SESSION_SECRET", "dev-only-secret-change-me"),
  trustProxy: env("TRUST_PROXY") === "1",
  db: {
    host: env("DB_HOST", "127.0.0.1"),
    port: +env("DB_PORT", "3306"),
    user: env("DB_USER", "datanomics"),
    password: env("DB_PASSWORD"),
    database: env("DB_NAME", "datanomics")
  },
  sheets: {
    webhook: env("SHEETS_WEBHOOK_URL"),
    secret: env("SHEETS_SECRET"),
    viewUrl: env("SHEETS_VIEW_URL")
  },
  feedsCron: env("FEEDS_CRON", "0 6 * * *")
};

if (config.prod && config.sessionSecret.length < 32) {
  console.error("SESSION_SECRET must be at least 32 characters in production. See .env.example.");
  process.exit(1);
}
