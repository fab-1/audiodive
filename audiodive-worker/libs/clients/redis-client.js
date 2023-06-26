const Redis = require("ioredis");
Redis.Promise = require('bluebird')

const Config = require(__base + 'config');
const Logging = require(__base + 'libs/logging')

const redisParams = Config.get('REDIS_URL').split(':')
const redisConfig = {
    host: redisParams[0],
    port: redisParams[1],
    password: Config.get('REDIS_PASSWD')
}

const client = new Redis(redisConfig)

client.on('error', function (err) {
    Logging.error(err)
})

client.on('ready', function (err) {
    Logging.info('Connected to redis!')
})



module.exports = client