<<<<<<< HEAD
# DATANOMICS TECHNOLOGIES Ltd: Website

The corporate website for **DATANOMICS TECHNOLOGIES Ltd**, Norrsken Kigali Building, Kigali, Rwanda.

The site is plain **HTML, CSS and JavaScript**. There is no build step and nothing to install. Open any `.html` file in a browser to see it, edit it in any text editor (VS Code is recommended), and upload the folder to any web host.

## Files

```
index.html            Home
about.html            About us
verticals.html        All verticals (four divisions)
verticals/*.html      One page per vertical (branding, marketing, media, software, erp, cloud-cyber,
                      ai-automation, transformation, connectivity, it-supply, integration, training)
portfolio.html        Projects
team.html             Team
testimonials.html     Testimonials
insights.html         Articles
contact.html          Contact form, details, map
404.html              "Page not found"
assets/css/styles.css All styles: colours and fonts are set at the top in :root
assets/js/main.js     Menu, animations, counters, filters, pop-ups, forms
assets/img/           Logo, favicon, share image, project and article cover images
sitemap.xml, robots.txt  For search engines
```

## Editing tips

- **Text on a page:** open the page's `.html` file and edit the text between the tags.
- **Colours:** change the values at the top of `assets/css/styles.css` (for example `--blue`, `--lime`, `--midnight`).
- **Menu, footer and newsletter:** these are repeated on every page. In VS Code, use **Edit → Replace in Files** (Ctrl+Shift+H) to change them everywhere at once.
- **Images:** replace a file in `assets/img/covers/` with a real photo of the same name, or change the `src="..."` in the HTML.
- **Logo:** replace `assets/img/logo.svg` and `assets/img/favicon.svg`. The logo inside pages is the `<symbol id="logo">` near the bottom of each HTML file.
- **Icons:** each page ends with an icon library (`<symbol id="i-...">`). Leave it in place; the icons on the page use it.

### Receive the contact form by email

1. Create a free form at [formspree.io](https://formspree.io) and copy its URL (it looks like `https://formspree.io/f/abcdwxyz`).
2. In `contact.html`, find `data-endpoint=""` on the `<form class="glass cf" id="cf" ...>` tag and paste the URL between the quotes.

Until you do this, the form opens a pre-filled WhatsApp message to +250780591568.

### Newsletter

Paste your mailing-list form URL into `data-endpoint=""` on `<form id="news" ...>`. This form appears on every page, so use **Replace in Files**.

### Social media links

Social icons currently show "coming soon". Replace `href="#" data-soon aria-label="Datanomics on LinkedIn"` with `href="https://linkedin.com/company/your-page" target="_blank" rel="noopener" aria-label="Datanomics on LinkedIn"`. Do the same for X, Facebook and Instagram, across all files.

## Publish on GitHub Pages (free)

1. Upload all files in this folder to the root of the repository's `main` branch. Keep `.nojekyll`.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/ (root)**, then click **Save**.
4. After a minute or two, the site is live at the address shown on that page, for example `https://<organisation>.github.io/<repository>/`.

Every change you push to `main` goes live automatically.

### Your own domain (e.g. www.datanomics.rw)

1. In **Settings → Pages → Custom domain**, enter the domain and save. GitHub adds a `CNAME` file.
2. At your domain registrar, add a `CNAME` record for `www` pointing to `<organisation>.github.io`.
3. Tick **Enforce HTTPS** once the certificate is ready.
4. Replace `https://datanomics-tech.github.io/website` with your domain in `sitemap.xml`, `robots.txt` and the `canonical` / `og:` tags at the top of each page (Replace in Files).

## Before going live

- Replace the sample testimonials and the five placeholder staff profiles (both are labelled on the site).
- Review the draft message from the Managing Director on the home page.
- Connect the contact form to email (see above).
=======
# datanomics_site
This is the repository for Datanomics Website Development
>>>>>>> b329690d0316a7302d8783ea3b103b0087a789f5
