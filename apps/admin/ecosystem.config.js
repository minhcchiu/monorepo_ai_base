module.exports = {
  apps: [
    {
      name: "cloudpulse-web-admin",
      script: "node_modules/.bin/next",
      args: "start -p 32090",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 32090,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3001,
      },
    },
  ],
};
