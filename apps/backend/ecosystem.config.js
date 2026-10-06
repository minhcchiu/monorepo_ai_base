module.exports = {
  apps: [
    {
      name: "cloudpulse-backend",
      script: "dist/src/main.js",
      cwd: "/home/cloudpulse/apps/backend",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 22090
      }
    }
  ]
};