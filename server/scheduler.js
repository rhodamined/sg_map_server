/* ------------------------------------------------ */
/* Node-Cron scheduler to pull & save JSON    
/* ------------------------------------------------ */
// saveAPIDataToJSON: 
// - Pull all data from API every hour, parse into single json file
// - Create folder for the day and write file
// - File name to include timestamp of the hour

// runPythonScript: 
// - at 00:01 every day, process entire previous day's worth of data into single json
// - GET requests to server return these json files


// import my modules
const carparks = require("./carpark");
const subway = require("./subway");
const sgtime = require("./sgtime");

// import libraries
const cron = require("node-cron");
const fse = require('fs-extra');

// use to run python
const { spawn } = require('child_process');


// IIFE FOR TESTING
// (async function() {
//     console.log("IIFE");
//     // runPythonScript("2025-08-22");
//     runPythonScript();
//     // await saveAPIDataToJSON();
//     // clearDataLog();
// })();


/* ------------------------------------------------ */
/* Schedulers
/* ------------------------------------------------ */
// use https://crontab.guru/ to make expression for scheduling

// Every 15 minutes, poll Datamall API for carpark and suwbay data and save results to /data
cron.schedule("0,15,30,45 */1 * * *", saveAPIDataToJSON);

// Every day at 00:01, process entire previous day's worth of data into a csv and json
cron.schedule('1 0 * * *', runPythonScript);

// Every day at 23:55, empty /data/log.txt
cron.schedule('55 23 * * *', clearDataLog);


/* ------------------------------------------------ */
/* Function: Run Python Script  
/* ------------------------------------------------ */

// optional to pass date_str
// if called without an arg, defaults to 'yesterday'
async function runPythonScript(date_str) {
    console.log('Running Python script...');

    // Handle yesterday
    let yyyymmdd;

    // this single boolean check caused a lot of grief... 
    // when called within cron-job, a blank [object Object] is passed, which passes !date_str
    // need to make explicit expecting a string
    // javascript lets u hang urself ugh
    if (!date_str || ((typeof date_str) != "string")) { 
      const yesterday = new Date(Date.now() - 86400000);
      yyyymmdd = sgtime.getYYYYMMDD(yesterday);  
    } else {
      yyyymmdd = date_str;
    }

    // log for monitoring; python script also writes to ./output/log.txt
    // const log_path = "./output/log.txt";
    // await updateLogFile(log_path, "Received date_str: " + date_str + "\n");


    // Spawn a child process to execute the Python script; make explicit path to venv python
    const pythonProcess = spawn('./.venv/bin/python3', ['./python_scripts/make_led_csv_and_json.py', yyyymmdd]);

    // Handle stdout from the Python script
    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python script output: ${data.toString()}`);
    });

    // Handle stderr from the Python script
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python script error: ${data.toString()}`);
    });

    // Handle process exit
    pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);
    });
    
}

/* ------------------------------------------------ */
/* Function: make API calls, save to file 
/* ------------------------------------------------ */

// Save logs to file
async function saveAPIDataToJSON() {

    // Use same file structure and file name for every log; preserves on-the-minute log
    // Differentiated only by file tree
    const ts_str = getTimestampString();


    /* ------ SETUP ------- */
    const log_path = "./data/log.txt";
    const carpark_path = `./data/carpark_availability/${ts_str}.json`;
    const subway_path = `./data/subway_crowdedness/${ts_str}.json`;
    
    // delineate log
    await updateLogFile(log_path, "--\n");


    /* ------ CARPARK AVAILABILITY ------- */
    console.log("Started pulling carpark availability at " + new Date());
    await updateLogFile(log_path, "Started pulling carpark availability at " + new Date() + "\n");

    let data = await carparks.getAllCarparks();

    // IF ERROR -- hacky kind of handling
    if (typeof data == "string") {
      console.log(data);
      await updateLogFile(log_path, `${data}\n`);

    } 
    else { // WORKING GOOD
      const payload_carpark = {timestamp: sgtime.getISOString(), value: data}; // timestamps when request complete
      await writeJSONFile(carpark_path, payload_carpark);
  
      console.log("Carpark log completed at " + new Date());
      await updateLogFile(log_path, "Carpark log completed at " + new Date() + " with {" + data.length + "} records \n");
    }


    /* ------ SUBWAY CROWDEDNESS ------- */
    console.log("Started pulling subway station crowdedness at " + new Date());
    await updateLogFile(log_path, "Started pulling subway station crowdedness at " + new Date() + "\n");

    data = await subway.getAllSubway();

    // IF ERROR -- hacky kind of handling...
    if (typeof data == "string") {
      console.log(data);
      await updateLogFile(log_path, `${data}\n`);

    } 
    else { // IF WORKING GOOD
      const payload_subway = {timestamp: sgtime.getISOString(), value: data}; // timestamps when request complete
      await writeJSONFile(subway_path, payload_subway);
  
      console.log("Subway station crowdedness json completed at " + new Date());
      await updateLogFile(log_path, "Subway station crowdedness json completed at " + new Date() + " with {" + data.length + "} records. \n");
    }

}

/* ------------------------------------------------ */
/* Helpers / Testers  
/* ------------------------------------------------ */

// Tester task
async function task() {
    console.log("Running a scheduled job at " + new Date());
}

// fs-extra library 
// outputJson will create directories if they don't already exist
// payload expected to be in javascript object format
async function writeJSONFile(file_path, payload) {
  try {
    // output to file
    await fse.outputJson(file_path, payload);

  } catch (err) {
    console.error(err);
  }
}

// Append to file
async function updateLogFile(log_path, payload) {
  try {
    await fse.appendFile(log_path, payload);
    // console.log('Updated ' + log_path + ' successfully.');
  } catch (err) {
    console.error('Error appending to ' + log_path + ':', err);
  }
}

// overwrite ./data/log.txt with empty string
async function clearDataLog() {
  const file_path = "./data/log.txt";
  try {
    await fse.outputFile(file_path, '');

  } catch (err) {
    console.error("Error clearing file: " + file_path, err)
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


