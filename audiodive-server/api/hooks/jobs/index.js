const Redis = require("ioredis")
const Queue = require('bull')
Redis.Promise = require('bluebird')

module.exports = function (sails) {

    let videoQueue = null
    let audioQueue = null

    return {
        initialize: function (cb) {

            const {client} = sails.hooks.ioredis

            const opts = {
                createClient: type => {
                    switch (type) {
                        case 'client':
                            return client
                        case 'subscriber':
                            return client
                        default:
                            return client
                    }
                }
            }

            const DEV_SUFFIX = (sails.config.environment === 'production' ? '' : '-dev')

            videoQueue = new Queue('video-clip-processing' + DEV_SUFFIX, opts)
            audioQueue = new Queue('audio-jobs' + DEV_SUFFIX, opts)

            return cb()
        },
        getVideoQueue: () => videoQueue
    }

}
