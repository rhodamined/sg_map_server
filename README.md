# sg_map_server
Node server for sg map project with Matthew Lau.

## Overview
Express app for circulated-densities mapping project. Runs node-cron in background to log SG Datamall's realtime data APIs and to run a python script that collates that data into .json. Clients can make RESTful requests to get retrieve json. 

## Setup: node
- Have node.js installed (developed on v22.14.0)
- Clone this repo
- `npm install` to install all packages
- Configure .env file with an account key for SG Datamall API. Use key `ACCOUNT_KEY`.
- https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf 
- See above pdf for API info. See Matthew's documentation for his key.
- Uses cron-tab to schedule carpark and subway data to the /data folder
- Uses cron-tab to schedule processing of a full day's data at 00:01 every day
- Uses pm2 to manage the app and restart on a daily basis (trying to circumvent the server hanging onto api calls)

## Setup: python
- Have python installed and added to path
- install pandas library `pip install pandas`
- Update the python commands in node-cron "scheduler.js" to reflect this python install (e.g. is it `python3 script.py` or `python script.py`?)

## Run
- `npm run start` from the root folder to launch the express app using pm2. All pm2 commands must be fired using npm scripts because pm2 is included as a local node module through npm and not a global install. If desired, you can install pm2 globally instead. See package.json for scripts. 

## Data
- API data is saved as json locally to folder /data. `.gitignore` is configured to ignore folder `/data` so as not to push 100s of MB to this repo. Please do not change this behavior; if you need to add a reference file, put it in /ref. 

## Client Usage
- `/hello` to GET json file for yesterday's date. If no such file exists, serve up a contingency file, currently set to "2025-08-19". 
- `/datalog` to GET txt file for log of API pulls from Datamall. Very helpful for troubleshooting... suspect API has unspoken limits.
- `/outputlog` to GET txt file for log of python script that parses data into the arduino-usable JSON. Use to see which dates have really bad data. 