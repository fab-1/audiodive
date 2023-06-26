'use strict'

global.__base = __dirname + '/'

const videoProcessing = require('./libs/proc/video-processing')

exports.processVideo = async (req, res) => {
    const {clipId, config, userId} = req.body
    await videoProcessing.videoJob({
        data: {
            clipId,
            config,
            userId,
        },
        progress: (val) => {
            console.log(val)
        }
    })
    res.send(`job posted`)
}
