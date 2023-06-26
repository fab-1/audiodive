const Redis = require("ioredis")
Redis.Promise = require('bluebird')

module.exports = function (sails) {

    const {host, port, password} = sails.config.redis

    const redisConfig = {
        host,
        port,
        password
    }

    const client = new Redis(redisConfig)

    client.on('error', function (err) {
        console.error(err)
    })

    client.on('ready', function (err) {
        console.info('Connected to ioredis!')
    })

    return {
        client
    }

}
