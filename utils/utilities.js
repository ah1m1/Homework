function convertDate(date, past) {

    date.setDate(date.getDate() + past);

    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();

    var mmChars = mm.split('');
    var ddChars = dd.split('');

    return yyyy + (mmChars[1] ? mm : "0" + mmChars[0]) + (ddChars[1] ? dd : "0" + ddChars[0]);
}

function changeDate(date, past) {

    date.setDate(date.getDate() + past);
    return date;
}

module.exports = {convertDate, changeDate};