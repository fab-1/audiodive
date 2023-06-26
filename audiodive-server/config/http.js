/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */
const helmet = require('helmet')

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
     // 'helmetProtection',
      'poweredBy',
      'router',
      'www',
      'favicon',
    ],

    // order: [
    //   'cookieParser',
    //   'session',
    //   'bodyParserUrlEncoded',
    //   'bodyParserJson',
    //   'compress',
    //   'poweredBy',
    //   'router',
    //   'www',
    //   'favicon'
    // ],

    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/


    // helmetProtection: function helmetProtection(req, res, next) {
    //   return helmet()(req, res, next)
    // },

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

    // bodyParserUrlEncoded: (function () {
    //   const bodyParser = require('body-parser')
    //   return bodyParser.urlencoded({ extended: true })
    // })(),
    //
    // bodyParserJson: (function () {
    //   const bodyParser = require('body-parser')
    //   return bodyParser.json()
    // })()

    bodyParser: (function _configureBodyParser(){
      var skipper = require('skipper');
      var middlewareFn = skipper({
        strict: true,
        maxTimeToBuffer: 100000,
      });
      return middlewareFn;
    })(),

    poweredBy:  function (req, res, next) {
      // or uncomment if you want to replace with your own
      res.set('X-Powered-By', "AudioDive");
      return next();
    }

  },

};
