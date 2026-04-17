module.exports = {
  apps: [
    {
      name: "skykoi-api",
      cwd: "/var/www/skykoi/app/backend",
      script: "src/server.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
