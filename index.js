// Express app for scheduling node-cron job

/* -------------------- */
/* SETUP      
/* -------------------- */

const fse = require("fs-extra")
const express = require("express")
const dotenv = require("dotenv")
dotenv.config()

const app = express()
const port = process.env.PORT || 6001
app.use(express.json())

// Node-cron scheduler, which continues running in background
// Pulls and saves data every hour
require("./server/scheduler")

// Help with time formating
const sgtime = require("./server/sgtime")

/* -------------------- */
/* SERVER        
/* -------------------- */
app.listen(port, async () => {
  console.log("Server running at port: " + port)
});

app.get("/", async (req, res) => {
  res.status(200).json({ status: "online" })
});

// GET JSON FOR ALL KML / LEDS
app.get("/hello", async (req, res) => {
  console.log("/hello")

  const yesterday = new Date(Date.now() - 86400000)
  const yyyymmdd = sgtime.getYYYYMMDD(yesterday)
  const filePath = __dirname + `/output/json/${yyyymmdd}.json`

  // if no file exists for date string, serve up a hard-coded file with good data
  const contingency = "2025-08-19" // fake it with a known 'good day'

  fse.access(filePath, fse.constants.F_OK, (err) => {
    if (err) {
      console.error(
        `${filePath} does not exist. Serving ${contingency} instead.\n`,
        err
      )
      res.sendFile(__dirname + `/output/json/${contingency}.json`)
    } else {
      res.sendFile(filePath)
    }
  })
});


// GET BY HOUR;; /hour/0 through /hour/23
app.get('/hour/:hour', async (req, res) => {
  const hour = parseInt(req.params.hour);

  // Return error if invalid hour
  if (hour < 0 || hour > 23) {
    return res.status(404).send(`${hour} is not a valid endpoint. Use an hour from 0 to 23. `); 
  }

  // yesterday
  const yesterday = new Date(Date.now() - 86400000)
  const yyyymmdd = sgtime.getYYYYMMDD(yesterday)
  const filePath = __dirname + `/output/json/${yyyymmdd}.json`

  const contingency = "2025-08-19" // if we need to, fake it with a known 'good day'
  
  // Check if file exists
  fse.access(filePath, fse.constants.F_OK, (err) => {

    // if it doesn't exist, serve up the contingency file
    if (err) {
      console.error(`${filePath} does not exist. Serving ${contingency} instead.\n`, err)

      // Read the file and serve up just 1 hour of it
      // Serving only 1 hour because Arduino cannot save all 24hrs to memory at one time
      fse.readJson(__dirname + `/output/json/${contingency}.json`, (err, payload) => {
        if (err) {
          console.error(err)
        } 
        else {
          for (let region of payload.regions) {
            for (let sz of region.subzones) { // array indices correspond to LED
              sz.carpark = sz.carpark[hour];
              sz.mrt = sz.mrt[hour];
            }
          }
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));

        }
      })

    } else {
      
      // Default behavior: read original file path, do same as above
      fse.readJson(filePath, (err, payload) => {
        if (err) {
          console.error(err)
        } 
        else {
          for (let region of payload.regions) {
            for (let sz of region.subzones) { // array indices correspond to LED
              sz.carpark = sz.carpark[hour];
              sz.mrt = sz.mrt[hour];
            }
          }
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));

        }
      })

    }
  })

});


// GET DATA LOG (PULLING FROM API)
app.get("/datalog", async (req, res) => {
  console.log("/datalog")

  const filePath = __dirname + `/data/log.txt`


  fse.access(filePath, fse.constants.F_OK, (err) => {
    if (err) {
      console.error(
        `${filePath} does not exist.`,
        err
      )
    } else {
      res.sendFile(filePath)
    }
  })
});

// GET OUTPUT LOG (PARSING DATA & WRITING TO JSON)
app.get("/outputlog", async (req, res) => {
  console.log("/outputlog")

  const filePath = __dirname + `/output/log.txt`


  fse.access(filePath, fse.constants.F_OK, (err) => {
    if (err) {
      console.error(
        `${filePath} does not exist.`,
        err
      )
    } else {
      res.sendFile(filePath)
    }
  })
})
