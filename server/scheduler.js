
// Pull all data from API every hour, parse into single json file
// Create folder for the day and write file
// File name to include timestamp of the hour



// import carpark.js 
const carparks = require("./carpark");

const cron = require("node-cron");


// IIFE FOR TESTING
(async function() {
    console.log(getSGTime())
    // await carparks.getAllCarparks();
})();


// TESTER TASK
async function task() {

    console.log("Running a scheduled job at " + new Date());
}


// handle time -- singapore time
// timestamp should be: YMD_24HOUR
function getSGTime() {
    
    // https://stackoverflow.com/questions/11124322/get-date-time-for-a-specific-time-zone-using-javascript
    let time_now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"})); // timezone ex: Asia/Jerusalem
    const year = time_now.getFullYear();
    const date = time_now.getDate();
    const month = time_now.getMonth()+1;

    let yyyymmdd = `${year}${twoDigit(month)}${twoDigit(date)}`;
    return yyyymmdd;
}

// add leading 0 if there's only 1 digit
function twoDigit(num) {
    let str = num.toString();
    if (str.length < 2) {
        str = '0' + str;
    }
    return str;
}


// function: make directory for the day

// function: save file to directory 
// --- if directory for the day does not exist, make it
// --- make timestamp for the day and hour




// use https://crontab.guru/ to make expression for scheduling
// "* * * * *" is for every minute

// "0,15,30,45 */1 * * *" is "At minute 0, 15, 30, and 45 past every hour"
cron.schedule("* * * * *", task);