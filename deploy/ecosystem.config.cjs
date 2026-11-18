// PM2 process file:  pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup
module.exports = { apps: [{ name: "datanomics", script: "server.js", cwd: __dirname + "/..", instances: 1, env: { NODE_ENV: "production" } }] };
