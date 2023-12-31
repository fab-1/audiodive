module.exports = {
    convertStringTimeToInt : (timeString) => {

        if (!timeString) {
            return 0;
        }

        const timeRegex = /(?:(?:([01]?\d|2[0-3]):)?([0-9]?\d):)?([0-5]?\d)/g;
        const newTime = timeString.replace(timeRegex, (match, h, m, s) => {
            if (m == undefined || s == undefined) {
                return parseInt(match);
            }
            else {
                var time = parseInt(s);
                time += (m * 60);
                if (h) {
                    time += h * 3600;
                }
                return time;
            }
        });

        return newTime;
    },
    convertNumericTimeToString : (seconds) =>{

        if (seconds == 0) {
            return '';
        }

        var sec_num = parseInt(seconds, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}

        return hours + ':' + minutes + ':' + seconds;
    }
}