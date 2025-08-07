/* ------------------------------------------------ */
/* Node-Cron scheduler to pull & save JSON    
/* ------------------------------------------------ */
// Pull all data from API every hour, parse into single json file
// Create folder for the day and write file
// File name to include timestamp of the hour


// import my modules
const carparks = require("./carpark");
const subway = require("./subway");
const sgtime = require("./sgtime");

// import libraries
const cron = require("node-cron");
const fse = require('fs-extra');


/* ------------------------------------------------ */
/* Scheduler Task   
/* ------------------------------------------------ */
// use https://crontab.guru/ to make expression for scheduling
// "* * * * *" is for every minute
// "0,15,30,45 */1 * * *" is "At minute 0, 15, 30, and 45 past every hour"

// cron.schedule("* * * * *", task); // tester scheduler
cron.schedule("0,15,30,45 */1 * * *", saveToJSON);


/* ------ HELPERS ------- */

// IIFE FOR TESTING
// (async function() {
//     console.log("IIFE");
// })();


// Tester task
async function task() {
    console.log("Running a scheduled job at " + new Date());
}

// Save logs to file
async function saveToJSON() {

    // Use same file structure and file name for every log; preserves on-the-minute log
    // Differentiated only by file tree
    const ts_str = getTimestampString();

    /* ------ CARPARK AVAILABILITY ------- */
    let fileStr = `./data/carpark_availability/${ts_str}.json`;

    console.log("Logging carpark availability at " + new Date());

    let data = await carparks.getAllCarparks();
    const payload_carpark = {timestamp: sgtime.getISOString(), value: data} // timestamps when request complete
    await writeFile(fileStr, payload_carpark);

    console.log("Carpark log completed at " + new Date());

    
    /* ------ SUBWAY CROWDEDNESS ------- */
    fileStr = `./data/subway_crowdedness/${ts_str}.json`;

    console.log("Logging subway crowdedness at " + new Date());

    data = await subway.getAllSubway();
    const payload_subway = {timestamp: sgtime.getISOString(), value: data} // timestamps when request complete
    await writeFile(fileStr, payload_subway);

    console.log("Subway crowdedness log completed at " + new Date());

}


// fs-extra library 
// outputJson will create directories if they don't already exist
// payload expected to be in javascript object format
async function writeFile (file_str, payload) {
  try {
    // output to file
    await fse.outputJson(file_str, payload)

  } catch (err) {
    console.error(err)
  }
}


function getTimestampString() {
    const d = sgtime.getSGDate();
    const yyyymmdd = sgtime.getYYYYMMDD(d);
    const hh = sgtime.getHH(d);
    const mm = sgtime.getMM(d);
    const str = `${yyyymmdd}/${yyyymmdd}_${hh}-${mm}`;

    return str;
}


