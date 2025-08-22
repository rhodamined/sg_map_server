module.exports = {
  apps : [{
    name   : "index",
    script : "./index.js",
    cron_restart: '5 0 * * *', // restart at 00:05 every day
  }]
}