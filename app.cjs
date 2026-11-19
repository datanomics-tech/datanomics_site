// cPanel / Passenger start file: loads the main server.
import("./server.js").catch(err => { console.error(err); process.exit(1); });