
// import carpark.js 
const carparks = require("./carpark");

(async function() {
    await carparks.getAllCarparks();
})();



const cron = require("node-cron");

const task = () => {
    console.log("Running a scheduled job at " + new Date());
}

// use https://crontab.guru/ to make expression for scheduling
// "* * * * *" is for every minute

// "0,15,30,45 */1 * * *" is "At minute 0, 15, 30, and 45 past every hour"
cron.schedule("* * * * *", task);