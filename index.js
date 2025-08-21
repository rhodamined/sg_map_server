// Express app for scheduling node-cron job


/* -------------------- */
/* SETUP      
/* -------------------- */

const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 6001;
app.use(express.json());

// Node-cron scheduler, which continues running in background
// Pulls and saves data every hour
require("./server/scheduler");
const p = require("./server/process");



/* -------------------- */
/* SERVER        
/* -------------------- */

app.listen(port, async () => {
    console.log("Server running at port: " + port);
    
    //get availability on spinup
    global.avails = await p.getAvailability();
    // res.json(global.avails['timestamp']);
})


// Refresh local variables
app.get('/update', async (req, res) => {
  console.log("update");
  // write to global variable
  global.avails = await p.getAvailability();
  res.json(global.avails['timestamp']);
});


app.get('/test', async (req, res) => {
  console.log("test");
  obj = global.avails;
  res.json(obj);
});


// get single character info using character NUMBER
// Updated 12/26/23
app.get('/kml/:kml', async (req, res) => {
  const kml = parseInt(req.params.kml);
  const val = global.avails['raw']['by_kml'][kml];

  console.log("kml: " + kml + ", availability: " + val);
  res.json(val);
});


// get single character info using character NUMBER
// Updated 12/26/23
app.get('/region/:region', async (req, res) => {
  const region = parseInt(req.params.region);
  const val = global.avails['raw']['by_region'][region];

  console.log("region: " + region + ", availability: " + val);
  res.json(val);
});