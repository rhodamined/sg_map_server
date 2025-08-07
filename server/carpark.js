module.exports = {
    getAllCarparks
}

/* ------------------------------------------------ */
/* API Calls to Singapore Datamall - Carparks     
/* ------------------------------------------------ */
// https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf


// Account key for SG datamall; previously loaded in index.js with dotenv.config()
const ACCT_KEY = process.env.ACCOUNT_KEY;


/* ---- PULL ALL RESPONSES FROM API, CONCAT AND RETURN ---- */
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

/* ---- FETCH FROM API ---- */
async function fetchCarpark(url) {

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