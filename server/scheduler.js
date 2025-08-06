
// Pull all data from API every hour, parse into single json file
// Create folder for the day and write file
// File name to include timestamp of the hour


// import my modules
const carparks = require("./carpark");
const sgtime = require("./sgtime");

// import libraries
const cron = require("node-cron");


// IIFE FOR TESTING
(async function() {
    console.log(sgtime.getYYYYMMDD() + '_' + sgtime.getH())
    // await carparks.getAllCarparks();
})();


// TESTER TASK
async function task() {

    console.log("Running a scheduled job at " + new Date());
}


// function: make directory for the day

// function: save file to directory 
// --- if directory for the day does not exist, make it
// --- make timestamp for the day and hour




// use https://crontab.guru/ to make expression for scheduling
// "* * * * *" is for every minute

// "0,15,30,45 */1 * * *" is "At minute 0, 15, 30, and 45 past every hour"
cron.schedule("* * * * *", task);