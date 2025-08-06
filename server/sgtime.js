module.exports = {
    getYYYYMMDD,
    getH
}

// handle time -- singapore time
// timestamp should be: YMD_24HOUR
function getYYYYMMDD() {

    // https://stackoverflow.com/questions/11124322/get-date-time-for-a-specific-time-zone-using-javascript
    let time_now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"})); // timezone ex: Asia/Jerusalem
    const year = time_now.getFullYear();
    const date = time_now.getDate(); 
    const month = time_now.getMonth()+1; // base function returns 0 to 11

    let yyyymmdd = `${year}${twoDigit(month)}${twoDigit(date)}`;
    return yyyymmdd;
}

function getH() {

    // https://stackoverflow.com/questions/11124322/get-date-time-for-a-specific-time-zone-using-javascript
    let time_now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"})); // timezone ex: Asia/Jerusalem
    const hour = time_now.getHours(); // base function returns 0 to 23

    let h = `${twoDigit(hour)}`;
    return h;
}

// add leading 0 if there's only 1 digit
function twoDigit(num) {
    let str = num.toString();
    if (str.length < 2) {
        str = '0' + str;
    }
    return str;
}