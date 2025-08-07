module.exports = {
    getAvailability
}

/* -------------------------------------------------------------- */
/* Return js object of carpark availability by kml and by region     
/* -------------------------------------------------------------- */

// import libraries
const fse = require('fs-extra');


// IIFE FOR TESTING
(async function() {
    const raw_avail = await getAvailability();
    console.log(raw_avail);
})();


async function getAvailability() {

    const filepath_carparkIDs = "./ref/SG_carpark_IDs.json"
    const filepath_data = "./data/carpark_availability/2025-08-08/2025-08-08_04-15.json"

    // using arrays as lookups; e.g. use arr[kml#] to get availability within kml#
    let kml_arr = new Array(333).fill(0); // total 332 subzones, +1 bc not using index 0
    let region_arr = new Array(5).fill(0);

    const carpark_lookup = await readJSONFile(filepath_carparkIDs); //keys are carpark IDs
    const carpark_data = await readJSONFile(filepath_data);
    const carpark_values = carpark_data['value'];

    // console.log(carpark_values[0]);

    // for each lot in carpark's log of values
    for (let e of carpark_values) {

        // get the id number of this lot
        let id = e['CarParkID'];

        // get the availability at this lot
        let avail = e['AvailableLots'];

        // if this lot ID is included in the lookup table
        if (carpark_lookup[id]) {

            // get the subzone/kml that carpark is within
            let kml = carpark_lookup[id]['subzone_kml'];

            // get the region that this carpark is within
            let region = carpark_lookup[id]['region_num'];

            // sum the # of avail lots of this lot ID into the kml/region arrays
            kml_arr[kml] += avail;
            region_arr[region] += avail;
        }

    }
    
    let obj = {
        'raw': {
            'by_kml': kml_arr,
            'by_region': region_arr
        },
        'normalized': {
            'by_kml': [],
            'by_region': []
        }
    }

    return obj;
}

// read JSON using fs-extra
async function readJSONFile(path) {
  try {
    const payload = await fse.readJson(path)
    return (payload)

  } catch (err) {
    console.error(err)
  }
}

