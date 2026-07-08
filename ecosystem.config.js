module.exports = {
  apps: [
    {
      name: 'codemastery-backend',
      script: './backend/src/index.js',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
    {
      name: 'codemastery-worker',
      script: './backend/src/worker/worker.js',
      env: {
        NODE_ENV: 'production',
      },
      autorestart: true,
      max_restarts: 15,
      restart_delay: 3000,
    }
  ]
};
