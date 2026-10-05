module.exports = {
  apps: [
    {
      name: "pp09base-backend",
      script: "dist/src/main.js",
      cwd: "/home/pp09base/apps/backend",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 22090
      }
    }
  ]
};