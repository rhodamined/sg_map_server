# sg_map_server
Node server for sg map project with Matthew Lau.

## Overview
Express app for circulated-densities mapping project. Runs node-cron in background to log SG Datamall's realtime data APIs. Clients can make RESTful requests to get retrieve data. 

## Setup
- Have node.js installed (developed on v22.14.0)
- Clone this repo
- `npm install` to install all packages
- Configure .env file with an account key for SG Datamall API. Use key `ACCOUNT_KEY`.
- https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf 
- See above pdf for API info. 

## Run
- `node index.js` from the root folder to launch the express app. 

## Data
- All logged files save locally to folder /data. `.gitignore` is configured to ignore folder `/data` so as not to push 100s of MB to this repo. Please do not change this behavior; if you need to add a reference file, put it in /ref. 


## Usage
- `/update` to have the server refresh data
- `/kml/x` where x is 1 through 332 to retrieve data for each kml
- `/region/y` where y is 0 through 4 to retrieve data for each administrative region