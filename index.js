// Express app for scheduling node-cron job
// Pull all data from API every hour, parse into single json file
// Create folder for the day and write file
// File name to include timestamp of the hour

const express = require("express");
const dotenv = require("dotenv");


dotenv.config();
const app = express();
const port = process.env.PORT || 6001;

app.use(express.json());

app.listen(() => {
    console.log("Server running at port: " + port);
})