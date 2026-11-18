# Datanomics Technologies: Website and Admin Panel

This is the website for **DATANOMICS TECHNOLOGIES Ltd** together with a secure **admin panel**. It is built with **Node.js** and **MySQL**.

- **Public website:** the same design and pages as before. Verticals, portfolio, team, testimonials, insights and contact details now come from the database.
- **Admin panel** at `/admin`, with email and password sign-in:
  - **Dashboard:** new enquiries, articles waiting for review, an enquiries chart, and what is live on the site.
  - **Contacts:** every contact-form enquiry. Set its status, add internal notes, reply by email or WhatsApp, view the live Google Sheet and **download Excel**.
  - **Articles (Insights):** news is fetched every day from trusted sources for each category. **Approve** articles to publish them, or **hide** them. You can also write your own articles.
  - **News sources, Categories and Popular topics:** the categories and topics in the Insights sidebar, and the feeds articles are collected from.
  - **Verticals, Portfolio, Team, Testimonials:** add, edit, reorder, hide or delete, with image uploads.
  - **Site settings:** phone, email, address, opening hours, social links and the "Need advice?" box.
  - **Account & admins:** change your password and add or remove admins.
- **Contact form:** each enquiry is saved in MySQL **and** copied to a **Google Sheet in your shared Drive**. "Book a free call" on the Insights page opens the contact form with *Free advice call* already chosen.

## Requirements

- Node.js **20 or newer**
- MySQL **8** (or MariaDB 10.6+)

## Run it on your computer

1. Install MySQL. On Windows, use the *MySQL Installer* or XAMPP. Then create a database and a user:
   ```sql
   CREATE DATABASE datanomics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'datanomics'@'localhost' IDENTIFIED BY 'a-strong-password';
   GRANT ALL ON datanomics.* TO 'datanomics'@'localhost';
   ```
2. In the project folder:
   ```bash
   npm install
   copy .env.example .env        # macOS/Linux: cp .env.example .env
   ```
3. Open `.env` and fill in `DB_PASSWORD`, `SESSION_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. Create the tables, load the current website content and create your admin account:
   ```bash
   npm run db:setup
   ```
5. Start the site:
   ```bash
   npm start
   ```
   - Website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Connect the Google Sheet (shared Drive)

Follow **`google-apps-script/SETUP.md`**. It takes about five minutes: create the sheet, paste the script, deploy it, then add three lines to `.env`. Until the sheet is connected, enquiries are still saved in the database and can be downloaded as Excel from the admin panel.

## Insights: how articles are collected

- Each **news source** is an RSS feed linked to a category. Starter sources include The Hacker News, BleepingComputer, CISA, MIT Technology Review, the AWS and Google Cloud blogs, TechCabal, IEEE Spectrum, EFF, and Google News searches for Rwanda.
- Every day at 06:00 (`FEEDS_CRON` in `.env`), new articles from the last 45 days are added as **Waiting for review**. Nothing appears on the website until an admin publishes it.
- **Popular topics** (Penetration testing, Power BI, CCTV, Law 058/2021, Cloud costs, SOC) are matched by keywords in each article's title and summary. Visitors can click a topic to filter the list.
- Click **Fetch latest news** in the admin panel to check all sources immediately, or run `npm run feeds:fetch`.
- If a source stops working, **News sources** shows the error so you can fix or replace its address.

## Put it online

GitHub Pages only hosts static files, so this version needs a server that runs Node.js and MySQL. Choose one of these:

### A. VPS with Nginx and PM2 (recommended)

For example DigitalOcean, Contabo, AWS Lightsail, or a Rwandan provider such as AOS.

```bash
# on the server (Ubuntu)
sudo apt install -y nginx mysql-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2
git clone https://github.com/<your-org>/<your-repo>.git datanomics && cd datanomics
npm ci --omit=dev
cp .env.example .env && nano .env      # set NODE_ENV=production, TRUST_PROXY=1, SITE_URL, DB_*, SESSION_SECRET, ADMIN_*
npm run db:setup
pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup
sudo cp deploy/nginx.conf /etc/nginx/sites-available/datanomics && sudo ln -s /etc/nginx/sites-available/datanomics /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d datanomics.rw -d www.datanomics.rw   # free HTTPS certificate
```

To deploy updates later: `git pull && npm ci --omit=dev && pm2 restart datanomics`.

### B. Docker

On any server with Docker, fill in `.env` (also set `DB_ROOT_PASSWORD`), then run `docker compose up -d`.

### C. cPanel hosting with "Setup Node.js App"

1. Create a MySQL database and user in cPanel.
2. Upload the project and create a Node.js app with startup file `server.js`.
3. Add the `.env` values as environment variables, run `npm install`, then run `node scripts/db-setup.js` once from the cPanel terminal.

Once the new server is live, point your domain at it and turn off GitHub Pages in the repository settings.

## Where to change things

| What | Where |
|---|---|
| Verticals, portfolio, team, testimonials, articles, contact details | Admin panel |
| Fixed page text (home hero, About story, mission) | `views/pages/*.html` |
| Header and footer layout | `views/partials/header.html`, `footer.html` |
| Styles | `public/assets/css/styles.css` |
| Website scripts | `public/assets/js/main.js` |
| Admin panel | `admin/` |
| Server routes and database | `server.js`, `src/`, `db/schema.sql` |

## Security

- Passwords are hashed with bcrypt and sessions are stored in MySQL. Session cookies are HTTP-only, use SameSite=Lax, and are Secure when served over HTTPS.
- Sign-in attempts and public forms are rate-limited. Every admin change requires a CSRF token.
- A strict Content-Security-Policy and other security headers are set (helmet). All database values are escaped when shown on a page, and all queries are parameterised.
- Uploads accept only JPG, PNG, WebP or GIF images up to 4 MB. The contact form includes a hidden spam trap.
- The Google Sheet script needs a shared secret and blocks spreadsheet formula injection.
- **Never commit `.env`** (it is already in `.gitignore`). Use a long random `SESSION_SECRET` and serve the site over HTTPS.

To reset a forgotten password from the server, run `npm run admin:create -- "Name" email@example.com "NewPassword123"`.
