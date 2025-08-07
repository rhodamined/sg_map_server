// read json for carpark ids

const fse = require('fs-extra');


let path_a = "./ref/SG_carpark_IDs.json"

// With async/await:
async function example () {
  try {
    console.log(path_a);
    console.log(process.cwd());
    const packageObj = await fse.readJson(path_a)
    console.log(packageObj) // => 0.1.3
  } catch (err) {
    console.error(err)
  }
}


// IIFE FOR TESTING
(async function() {
    console.log("IIFE");
    await example();
})();