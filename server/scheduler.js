/* ------------------------------------------------ */
/* Node-Cron scheduler to pull & save JSON    
/* ------------------------------------------------ */
// Pull all data from API every hour, parse into single json file
// Create folder for the day and write file
// File name to include timestamp of the hour


// import my modules
const carparks = require("./carpark");
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
cron.schedule("0,15,30,45 */1 * * *", saveCarparksJSON);


/* ------ HELPERS ------- */

// IIFE FOR TESTING
// (async function() {
//     console.log("IIFE");
//     await saveCarparksJSON();
// })();


// TESTER TASK
async function task() {
    console.log("Running a scheduled job at " + new Date());
}

// ACTUAL TASK
async function saveCarparksJSON() {
    const fileStr = await getFileString();

    console.log("Running a scheduled job at " + new Date());

    let data = await carparks.getAllCarparks();
    const payload = {timestamp: sgtime.getISOString(), value: data} // getISOString() timestamps when request complete
    await writeFile(fileStr, payload);

    console.log("Job completed at " + new Date());
}


// fs-extra library 
// outputJson will create directories if they don't already exist
// payload expected to be in javascript object format
async function writeFile (file_str, payload) {
  try {
    // output to file
    await fse.outputJson(file_str, payload)

    // read it back to log it
    // const data = await fse.readJson(file_str)
    // console.log(data) 

  } catch (err) {
    console.error(err)
  }
}

function getFileString() {
    const d = sgtime.getSGDate();
    const yyyymmdd = sgtime.getYYYYMMDD(d);
    const hh = sgtime.getHH(d);
    const mm = sgtime.getMM(d);
    const str = `./data/${yyyymmdd}/${yyyymmdd}_${hh}-${mm}.json`;

    return str;
}


