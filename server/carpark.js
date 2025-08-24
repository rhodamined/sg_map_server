module.exports = {
  getAllCarparks,
}

/* ------------------------------------------------ */
/* API Calls to Singapore Datamall - Carparks     
/* ------------------------------------------------ */
// https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf

// Account key for SG datamall; previously loaded in index.js with dotenv.config()
const ACCT_KEY = process.env.ACCOUNT_KEY

/* ---- PULL ALL RESPONSES FROM API, CONCAT AND RETURN ---- */
async function getAllCarparks() {
  let carparks = []
  let chances = 0
  let skip = 0

  do {
    // format url
    let url =
      "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2"
    if (skip > 0) {
      url = url + "?$skip=" + skip;
    }

    // fetch
    const res = await fetchCarpark(url);

    if (res) {
      const data = res.value; // unnests and removes metadata; this is an array of objects
  
      // console.log(data);
  
      // concat arrays of data
      carparks.push(...data);
      console.log(carparks.length);
  
      // iterate over dataset
      skip += 500;
      chances++;

    } else {
      return "An error has occurred & carpark data could not be fetched. Stopped at skip=" + skip + " and {" + carparks.length + "} records";
    }
  } while (carparks.length % 500 == 0 && chances < 7) // expected ~2800 records; chances needs to be at least 2800/500 == ~6

  return carparks;
}

/* ---- FETCH FROM API ---- */
async function fetchCarpark(url) {
  const myHeaders = new Headers()
  myHeaders.append("AccountKey", ACCT_KEY)

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  }

  return await fetch(url, requestOptions)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}\n`)
      }
      return response.json()
    })
    .catch((error) => { 
      updateLogFile(log_path, error.toString());
      console.error(error)
    })
}


/* ---- UPDATE ./data/log.txt ---- */
async function updateLogFile (log_path, payload) {

  try {
    await fse.appendFile(log_path, payload);
    // console.log('Updated ' + log_path + ' successfully.');
  } catch (err) {
    console.error('Error appending to ' + log_path + ':', err);
  }

}
