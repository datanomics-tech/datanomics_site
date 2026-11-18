// Fetch news articles now (the server also does this daily). Usage: npm run feeds:fetch
import { pool } from "../src/db.js";
import { fetchFeeds } from "../src/services/feeds.js";

const r = await fetchFeeds();
for (const x of r.report || []) console.log(`${x.ok ? "✓" : "✗"} ${x.feed}: ${x.ok ? `${x.added} new` : x.error}`);
console.log(r.message);
await pool.end();
