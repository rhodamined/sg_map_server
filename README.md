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


## Usage
- `/update/` to have the server refresh data
- `/kml/x` where x is 1 through 332 to retrieve data for each kml
- `/region/y` where y is 0 through 4 to retrieve data for each administrative region