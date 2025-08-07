module.exports = {
    getAvailability
}

// read json for specific timestamp
// return js object of carpark availability by kml and by region

const fse = require('fs-extra');


// IIFE FOR TESTING
(async function() {
    const raw_avail = await getAvailability();
    console.log(raw_avail);
})();


async function getAvailability() {

    const filepath_carparkIDs = "./ref/SG_carpark_IDs.json"
    const filepath_data = "./data/2025-08-08/2025-08-08_01-30.json"
    const total_subzones = 332;
    const total_regions = 5;

    let kml_arr = new Array(total_subzones+1).fill(0); // not using index 0
    let region_arr = new Array(total_regions).fill(0);

    
    const carpark_lookup = await readJSONFile(filepath_carparkIDs); //keys are carpark IDs
    const carpark_data = await readJSONFile(filepath_data);
    const carpark_values = carpark_data['value'];

    // console.log(carpark_values[0]);

    // for each lot in carpark's log of values
    for (let e of carpark_values) {

        // get the id number of this lot
        let id = e['CarParkID'];

        // get the availability of this lot
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

    // console.log(kml_arr);
    // console.log(region_arr);
    
    let obj = {
        'raw': {
            'by_kml': kml_arr,
            'by_region': region_arr
        }
    }

    return obj;
}

// read json for carpark ids

async function readJSONFile(path) {
  try {
    const payload = await fse.readJson(path)

    // console.log(packageObj['Y64M'])
    // console.log(payload['value'][0]);

    return (payload)

  } catch (err) {
    console.error(err)
  }
}

