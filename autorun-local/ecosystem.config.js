module.exports = {
  apps: [{
    name: "freerun-autorun",
    script: "./server.js",
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 5891
    }
  }]
}
