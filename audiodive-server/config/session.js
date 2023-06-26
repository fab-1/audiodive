/**
 * Session Configuration
 * (sails.config.session)
 *
 * Use the settings below to configure session integration in your app.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For all available options, see:
 * https://sailsjs.com/config/session
 */



module.exports.session = {

    secret: process.env.SESSION_SECRET,
    adapter: '@sailshq/connect-redis',
    url: process.env.SESSION_URL,
    onRedisDisconnect: () => {
        console.log('redis disconnected')
    },
    onRedisReconnect: () => {
        console.log('redis reconnected')
    },

    cookie: {
        maxAge: null
    }
}
