module.exports = {
    getAllSubway
}


/* ----------------------------------------------------- */
/* API Calls to Singapore Datamall - Subway Crowdedness    
/* ----------------------------------------------------- */
// https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf


// Account key for SG datamall; previously loaded in index.js with dotenv.config()
const ACCT_KEY = process.env.ACCOUNT_KEY;


/* ---- PULL ALL RESPONSES FROM API, CONCAT AND RETURN ---- */
async function getAllSubway() {
    let station_data = [];
    let station_codes = ['CCL', 'CEL', 'CGL', 'DTL', 'EWL', 'NEL', 'NSL', 'BPL', 'SLRT', 'PLRT', 'TEL']

    for (const trainline of station_codes) {
        // format url
        let url = `https://datamall2.mytransport.sg/ltaodataservice/PCDRealTime?TrainLine=${trainline}`;

        // fetch
        const res = await fetchSubway(url);
        const data = res.value; // unnests and removes metadata; this is an array of objects

        // console.log(data);

        // concat arrays of data
        station_data.push(...data);
        console.log(trainline + ": " + station_data.length)
    } 

    return station_data;
}

/* ---- FETCH FROM API ---- */
// this is the same as in carpark.js... maybe modularize later... ugh
async function fetchSubway(url) {

    const myHeaders = new Headers();
    myHeaders.append("AccountKey", ACCT_KEY);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    return await fetch(url, requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); 
        })
        .catch((error) => console.error(error));
}