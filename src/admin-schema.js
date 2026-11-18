// Definition of every manageable content type. Drives both API validation and the admin forms.
import { ICONS } from "./data/icons.mjs";

const ICON_OPTIONS = Object.keys(ICONS).filter(k => !["i-arrow", "i-check", "i-star", "i-menu", "i-close", "i-up", "i-copy", "i-ext"].includes(k))
  .map(k => ({ value: k, label: k.replace("i-", "") }));
const DIVISIONS = [
  { value: "A", label: "A · Creative & Digital Experience" }, { value: "B", label: "B · Software, Data & Intelligence" },
  { value: "C", label: "C · Infrastructure & Managed Services" }, { value: "D", label: "D · Training & Technology Enablement" }
];

const sortPub = [
  { name: "sort_order", label: "Display order", type: "number", help: "Lower numbers appear first.", default: 100 },
  { name: "published", label: "Show on website", type: "bool", default: 1 }
];

export const ENTITIES = {
  verticals: {
    table: "verticals", label: "Verticals", singular: "Vertical", order: "sort_order, id",
    columns: ["short_name", "division", "sort_order", "published"],
    fields: [
      { name: "short_name", label: "Short name", type: "text", required: true, max: 80, help: "Used in menus and the footer, e.g. “ERP Systems”." },
      { name: "title", label: "Full title", type: "text", required: true, max: 200 },
      { name: "slug", label: "Page address", type: "text", required: true, max: 80, pattern: "^[a-z0-9-]+$", help: "Lowercase letters, numbers and hyphens. The page will be /verticals/<address>/." },
      { name: "division", label: "Division", type: "select", options: DIVISIONS, required: true },
      { name: "icon", label: "Icon", type: "icon", options: ICON_OPTIONS, default: "i-grid" },
      { name: "summary", label: "Card summary", type: "textarea", required: true, max: 400 },
      { name: "intro", label: "Page introduction", type: "textarea", required: true, max: 1200 },
      { name: "solutions", label: "What we can do (one per line)", type: "list" },
      { name: "deliverables", label: "What the client receives (one per line)", type: "list" },
      { name: "customers", label: "Who we work with (one per line)", type: "list" },
      { name: "technologies", label: "Tools and technologies (one per line)", type: "list" },
      { name: "note", label: "Note shown at the bottom (optional)", type: "textarea", max: 600 },
      ...sortPub
    ]
  },
  projects: {
    table: "projects", label: "Portfolio", singular: "Project", order: "sort_order, id",
    columns: ["title", "category", "is_live", "sort_order", "published"],
    fields: [
      { name: "title", label: "Project name", type: "text", required: true, max: 200 },
      { name: "category", label: "Category (used for filters)", type: "text", required: true, max: 80, suggest: "projects.category" },
      { name: "summary", label: "Short description", type: "textarea", required: true, max: 600 },
      { name: "details", label: "Full description (shown in the pop-up)", type: "textarea", max: 3000 },
      { name: "tags", label: "Tags (one per line)", type: "list" },
      { name: "stack", label: "Technology stack", type: "text", max: 255 },
      { name: "url", label: "Live link (optional)", type: "url", max: 500 },
      { name: "is_live", label: "Live project (otherwise marked illustrative)", type: "bool", default: 0 },
      { name: "cover_image", label: "Cover image", type: "image", help: "Leave empty to use a generated cover in the brand colours." },
      { name: "icon", label: "Icon on generated cover", type: "icon", options: ICON_OPTIONS, default: "i-layers" },
      { name: "color_a", label: "Cover colour 1", type: "color", default: "#0D6EFD" },
      { name: "color_b", label: "Cover colour 2", type: "color", default: "#00C853" },
      ...sortPub
    ]
  },
  team: {
    table: "team", label: "Team", singular: "Team member", order: "is_lead DESC, sort_order, id",
    columns: ["name", "role", "is_lead", "is_placeholder", "published"],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true, max: 160 },
      { name: "role", label: "Role", type: "text", required: true, max: 160 },
      { name: "bio", label: "Short bio", type: "textarea", max: 800 },
      { name: "photo", label: "Photo", type: "image", help: "Square photos look best. Leave empty to show initials." },
      { name: "linkedin", label: "LinkedIn profile", type: "url", max: 500 },
      { name: "x_url", label: "X (Twitter) profile", type: "url", max: 500 },
      { name: "is_lead", label: "Leadership (shown large at the top)", type: "bool", default: 0 },
      { name: "is_placeholder", label: "Mark as placeholder", type: "bool", default: 0 },
      ...sortPub
    ]
  },
  testimonials: {
    table: "testimonials", label: "Testimonials", singular: "Testimonial", order: "sort_order, id",
    columns: ["author", "company", "rating", "is_sample", "published"],
    fields: [
      { name: "quote", label: "What the client said", type: "textarea", required: true, max: 1000 },
      { name: "author", label: "Name or job title", type: "text", required: true, max: 160 },
      { name: "company", label: "Organisation", type: "text", max: 200 },
      { name: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5, default: 5 },
      { name: "is_sample", label: "Mark as sample", type: "bool", default: 0 },
      ...sortPub
    ]
  },
  insights: {
    table: "insights", label: "Insights", singular: "Article", order: "FIELD(status,'pending','published','hidden'), published_at DESC, id DESC",
    columns: ["title", "category_id", "source", "status", "published_at"],
    search: ["title", "summary", "source"], filters: ["status", "category_id"], pageSize: 25,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 390 },
      { name: "status", label: "Status", type: "select", options: [{ value: "pending", label: "Waiting for review" }, { value: "published", label: "Published" }, { value: "hidden", label: "Hidden" }], default: "published" },
      { name: "category_id", label: "Category", type: "select", optionsFrom: "insight_categories", required: true },
      { name: "featured", label: "Feature at the top of the Insights page", type: "bool", default: 0 },
      { name: "summary", label: "Summary", type: "textarea", max: 600 },
      { name: "body", label: "Full article (leave empty for external news)", type: "textarea", rows: 10, max: 60000, help: "Separate paragraphs with a blank line." },
      { name: "url", label: "Original article link (external news)", type: "url", max: 690 },
      { name: "source", label: "Source / publisher", type: "text", max: 150 },
      { name: "image_url", label: "Image", type: "image" },
      { name: "read_minutes", label: "Reading time (minutes)", type: "number", min: 1, max: 60 },
      { name: "published_at", label: "Publication date", type: "datetime" },
      { name: "origin", label: "Origin", type: "readonly" }
    ]
  },
  insight_categories: {
    table: "insight_categories", label: "Categories", singular: "Category", order: "sort_order, id",
    columns: ["name", "sort_order"],
    fields: [{ name: "name", label: "Category name", type: "text", required: true, max: 120 }, { name: "sort_order", label: "Display order", type: "number", default: 100 }]
  },
  insight_topics: {
    table: "insight_topics", label: "Popular topics", singular: "Topic", order: "sort_order, id",
    columns: ["name", "keywords", "sort_order"],
    fields: [
      { name: "name", label: "Topic name", type: "text", required: true, max: 120 },
      { name: "keywords", label: "Matching keywords (comma separated)", type: "text", required: true, max: 500, help: "Articles whose title or summary contains any keyword are tagged with this topic." },
      { name: "sort_order", label: "Display order", type: "number", default: 100 }
    ]
  },
  feeds: {
    table: "feeds", label: "News sources", singular: "News source", order: "category_id, name",
    columns: ["name", "category_id", "active", "last_fetched", "last_status"],
    fields: [
      { name: "name", label: "Source name", type: "text", required: true, max: 160 },
      { name: "url", label: "RSS / Atom feed address", type: "url", required: true, max: 700, help: "For a Google News search use https://news.google.com/rss/search?q=YOUR+WORDS&hl=en-RW&gl=RW&ceid=RW:en" },
      { name: "category_id", label: "Category", type: "select", optionsFrom: "insight_categories", required: true },
      { name: "active", label: "Fetch automatically", type: "bool", default: 1 },
      { name: "last_fetched", label: "Last fetched", type: "readonly" },
      { name: "last_status", label: "Last result", type: "readonly" }
    ]
  }
};

export const SETTINGS_FIELDS = [
  { name: "company_name", label: "Company name", type: "text" },
  { name: "email", label: "Email", type: "text" },
  { name: "phone", label: "Phone", type: "text" },
  { name: "whatsapp", label: "WhatsApp number (digits only, e.g. 250780591568)", type: "text", pattern: "^[0-9]{8,15}$" },
  { name: "address", label: "Address", type: "text" },
  { name: "hours_weekdays", label: "Hours Monday–Friday", type: "text" },
  { name: "hours_saturday", label: "Hours Saturday", type: "text" },
  { name: "hours_sunday", label: "Hours Sunday & public holidays", type: "text" },
  { name: "social_linkedin", label: "LinkedIn page", type: "url" },
  { name: "social_x", label: "X (Twitter) page", type: "url" },
  { name: "social_facebook", label: "Facebook page", type: "url" },
  { name: "social_instagram", label: "Instagram page", type: "url" },
  { name: "advice_title", label: "Insights “advice” box title", type: "text" },
  { name: "advice_text", label: "Insights “advice” box text", type: "textarea" }
];
