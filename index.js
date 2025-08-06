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


/* -------------------- */
/* SERVER        
/* -------------------- */



app.listen(port, async () => {
    console.log("Server running at port: " + port);
})
