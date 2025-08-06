// Express app for scheduling node-cron job
// Pull all data from API every hour, parse into single json file
// Create folder for the day and write file
// File name to include timestamp of the hour

const express = require("express");
const dotenv = require("dotenv");
dotenv.config();


const app = express();
const port = process.env.PORT || 6001;


// includes node-cron scheduler, which continues running in background
require("./server/scheduler");


/* -------------------- */
/* SERVER        
/* -------------------- */

app.use(express.json());

app.listen(port, async () => {
    console.log("Server running at port: " + port);
})




/* -------------------- */
/* API REQUEST           
/* -------------------- */

/*
async function getAllCarparks() {
    let carparks = [];
    skip = 0;

    do {
        // format url
        let url = "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2";
        if (skip > 0) { url = url+"?$skip=" + skip; }

        // fetch
        const res = await fetchCarpark(url);
        const data = res.value; // unnests and removes metadata; this is an array of objects

        // console.log(data);

        // concat arrays of data
        carparks.push(...data);
        console.log(carparks.length)

        // iterate over dataset 
        skip += 500;
        
    } while(carparks.length % 500 == 0);

    return carparks;
}


async function fetchCarpark(url) {

    const myHeaders = new Headers();
    myHeaders.append("AccountKey", ACCT_KEY);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    return fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); 
        })
        .catch((error) => console.error(error));
}

*/