global.__base = __dirname + '/';
const videoProcessing = require('./libs/proc/video-processing')
module.exports = videoProcessing.videoJob;