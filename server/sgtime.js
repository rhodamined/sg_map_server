module.exports = {
    getYYYYMMDD,
    getHHMMSS,
    getHHMM,
    getHH,
    getISOString
}

/* ------------------------------------------------ */
/* Cast all date time to Singapore time (SST)      
/* ------------------------------------------------ */

function getYYYYMMDD() {
    // https://stackoverflow.com/questions/11124322/get-date-time-for-a-specific-time-zone-using-javascript
    let time_now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"})); // timezone ex: Asia/Jerusalem
    const year = time_now.getFullYear();
    const date = time_now.getDate(); 
    const month = time_now.getMonth()+1; // base function returns 0 to 11

    let yyyymmdd = `${year}-${twoDigit(month)}-${twoDigit(date)}`;
    return yyyymmdd;
}

function getHHMMSS() {
    // https://stackoverflow.com/questions/11124322/get-date-time-for-a-specific-time-zone-using-javascript
    let time_now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"})); // timezone ex: Asia/Jerusalem
    const hour = time_now.getHours(); // base function returns 0 to 23
    const min = time_now.getMinutes(); // base function returns 0 to 59
    const sec = time_now.getSeconds(); // base function returns 0 to 59

    let hhmmss = `${twoDigit(hour)}:${twoDigit(min)}:${twoDigit(sec)}`;
    return hhmmss;
}


function getHHMM() {
    // https://stackoverflow.com/questions/11124322/get-date-time-for-a-specific-time-zone-using-javascript
    let time_now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"})); // timezone ex: Asia/Jerusalem
    const hour = time_now.getHours(); // base function returns 0 to 23
    const min = time_now.getMinutes(); // base function returns 0 to 59

    let hhmm = `${twoDigit(hour)}:${twoDigit(min)}`;
    return hhmm;
}



function getHH() {
    // https://stackoverflow.com/questions/11124322/get-date-time-for-a-specific-time-zone-using-javascript
    let time_now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"})); // timezone ex: Asia/Jerusalem
    const hour = time_now.getHours(); // base function returns 0 to 23

    let hh = `${twoDigit(hour)}`;
    return hh;
}


// returns format in YYYY-MM-DDTHH:MM:SS+offset 
// e.g. for 10:42am EDT == 22:42PM SST, the string would be: 2025-08-07T22:53:38+08:00
// can be parsed back to correct UTC timestamp using Date(isostring)
// thank god SG does not do daylight savings
function getISOString() {
    // https://stackoverflow.com/questions/11124322/get-date-time-for-a-specific-time-zone-using-javascript
    let time_now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"})); // timezone ex: Asia/Jerusalem
    const year = time_now.getFullYear();
    const date = time_now.getDate(); 
    const month = time_now.getMonth()+1; // base function returns 0 to 11
    const hour = time_now.getHours(); // base function returns 0 to 23
    const min = time_now.getMinutes(); // base function returns 0 to 59
    const sec = time_now.getSeconds(); // base function returns 0 to 59

    const timezone_offset = "+08:00"; // singapore is GMT+8

    let str = `${year}-${twoDigit(month)}-${twoDigit(date)}T${twoDigit(hour)}:${twoDigit(min)}:${twoDigit(sec)}${timezone_offset}`;


    /* test timestamp is parsed correctly for UTC */
    // let timestamp_sg = str;
    // console.log(timestamp_sg);
    // let timestamp_utc = new Date(timestamp_sg);
    // console.log(timestamp_utc);

    return str;
}


// add leading 0 if there's only 1 digit
function twoDigit(num) {
    let str = num.toString();
    if (str.length < 2) {
        str = '0' + str;
    }
    return str;
}