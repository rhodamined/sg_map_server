// Express app for scheduling node-cron job


/* -------------------- */
/* SETUP      
/* -------------------- */

const fs = require('fs');
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 6001;
app.use(express.json());

// Node-cron scheduler, which continues running in background
// Pulls and saves data every hour
require("./server/scheduler");

// Help with time formating
const sgtime = require("./server/sgtime");



/* -------------------- */
/* SERVER        
/* -------------------- */
app.listen(port, async () => {
    console.log("Server running at port: " + port);

})


// GET JSON
app.get('/hello', async (req, res) => {
  console.log("/hello");

  const yesterday = new Date(Date.now() - 86400000);
  const yyyymmdd = sgtime.getYYYYMMDD(yesterday);
  const filePath = __dirname + `/output/json/${yyyymmdd}.json`;

  // if no file exists for date string, serve up a hard-coded file with good data
  const contingency = '2025-08-19' // fake it with a known 'good day'

  fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
          console.error(`${filePath} does not exist. Serving ${contingency} instead.\n`, err);
          res.sendFile(__dirname + `/output/json/${contingency}.json`);
      } else {
          res.sendFile(filePath);
      }
  });

});

