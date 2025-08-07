
// Pull all data from API every hour, parse into single json file
// Create folder for the day and write file
// File name to include timestamp of the hour

// import my modules
const carparks = require("./carpark");
const sgtime = require("./sgtime");

// import libraries
const cron = require("node-cron");
const fse = require('fs-extra');


// IIFE FOR TESTING
(async function() {

    let testtime = sgtime.getISOString();
    console.log(testtime);
    let newtime = new Date(testtime);
    console.log(newtime);
    // await carparks.getAllCarparks();

    const fileStr = getFileString();
    const payload = {timestamp: sgtime.getISOString(), value: [1, 2, 3]}
    writeFile(fileStr, payload);
})();


// TESTER TASK
async function task() {

    console.log("Running a scheduled job at " + new Date());
}



// function: make directory for the day if one doesn't exist, then save file to directory


// fs-extra library 
// outputJson will create directories if they don't already exist
// payload expected to be in javascript object format
async function writeFile (file_str, payload) {
  try {
    // output to file
    await fse.outputJson(file_str, payload)

    // read it back to log it
    const data = await fse.readJson(file_str)
    console.log(data) 

  } catch (err) {
    console.error(err)
  }
}

function getFileString() {
    const date = sgtime.getYYYYMMDD();
    const hr = sgtime.getH();
    const str = `./data/${date}/${date}T${hr}.json`

    return str;
}


// function: save file to directory 
// --- if directory for the day does not exist, make it
// --- make timestamp for the day and hour




// use https://crontab.guru/ to make expression for scheduling
// "* * * * *" is for every minute

// "0,15,30,45 */1 * * *" is "At minute 0, 15, 30, and 45 past every hour"
cron.schedule("* * * * *", task);