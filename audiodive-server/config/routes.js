/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

    //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
    //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
    //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝
    'GET /app/:unused?/:unused?/:unused?/:unused?/:unused?': {action: 'entrance/view-app'},
    'GET /preview/:clipId': {action: 'preview/preview', locals: {layout: false}},
    'GET /unverified': {view: 'pages/unverified'},
    'GET /faq': {view: 'pages/faq'},
    'GET /legal/terms': {view: 'pages/legal/terms'},
    'GET /legal/privacy': {view: 'pages/legal/privacy'},
    'GET /contact': {view: 'pages/contact'},
    'GET /': {action: 'view-homepage-or-redirect'},
    'GET /signup': {action: 'entrance/view-signup'},
    'GET /email/confirm': {action: 'entrance/confirm-email'},
    'GET /email/confirmed': {view: 'pages/entrance/confirmed-email'},

    'GET /login': {action: 'entrance/view-login'},
    'GET /password/forgot': {action: 'entrance/view-forgot-password'},
    'GET /password/new': {action: 'entrance/view-new-password'},

    'GET /account': {action: 'account/view-account-overview'},
    'GET /account/password': {action: 'account/view-edit-password'},
    'GET /account/profile': {action: 'account/view-edit-profile'},


    //  ╔╦╗╦╔═╗╔═╗  ╦═╗╔═╗╔╦╗╦╦═╗╔═╗╔═╗╔╦╗╔═╗   ┬   ╔╦╗╔═╗╦ ╦╔╗╔╦  ╔═╗╔═╗╔╦╗╔═╗
    //  ║║║║╚═╗║    ╠╦╝║╣  ║║║╠╦╝║╣ ║   ║ ╚═╗  ┌┼─   ║║║ ║║║║║║║║  ║ ║╠═╣ ║║╚═╗
    //  ╩ ╩╩╚═╝╚═╝  ╩╚═╚═╝═╩╝╩╩╚═╚═╝╚═╝ ╩ ╚═╝  └┘   ═╩╝╚═╝╚╩╝╝╚╝╩═╝╚═╝╩ ╩═╩╝╚═╝
    '/terms': '/legal/terms',
    '/logout': '/api/v1/account/logout',


    //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
    //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
    //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝
    // …

    'GET /admin/api/user/index': {action: 'user/index'},
    'GET /admin/api/user/:userId/clips': {action: 'user/clips'},

    'GET /admin/api/content': {action: 'content/oracle'},

    'GET /admin/api/clip/index': {action: 'clip/index'},
    'GET /admin/api/clip/mine': {action: 'clip/myclips'},
    'POST /admin/api/clip/upload': {action: 'clip/upload'},

    'POST /admin/api/clip/cut': {action: 'clip/cut'},
    'POST /admin/api/clip/share': {action: 'clip/share'},
    'POST /admin/api/clip/share2': {action: 'clip/share2'},
    'PUT /admin/api/clip/:clipId': {action: 'clip/update'},
    'POST /admin/api/clip/process/:clipId': {action: 'clip/process'},
    'POST /admin/api/clip/clone/:clipId': {action: 'clip/clone'},
    'POST /admin/api/clip/:clipId/purchase': {action: 'clip/pruchase'},
    'POST /admin/api/clip/:clipId/unlock': {action: 'clip/unlock'},
    'GET /admin/api/merge': {action: 'clip/copy'},
    'POST /admin/api/clip/create_upload_url': {action: 'clip/create-url'},


    'POST /admin/api/clip/bookmark/:clipId': {action: 'clip/bookmark'},
    'GET /admin/api/clip/:clipId': {action: 'clip/get'},
    'GET /admin/api/clip/detect/:clipId': {action: 'clip/detect'},
    'GET /admin/api/clip/:clipId/access': {action: 'clip/get-access'},
    'GET /admin/api/clip/status/:clipId': {action: 'clip/status'},
    'DELETE /admin/api/clip/:clipId': {action: 'clip/delete'},

    'GET /admin/api/asset/index': {action: 'asset/index'},
    'GET /admin/api/asset/get_font': {action: 'asset/get-font'},
    'POST /admin/api/asset/upload': {action: 'asset/upload'},
    'DELETE /admin/api/asset/:assetId': {action: 'asset/delete'},
    'GET /admin/api/unsplash/search': {action: 'unsplash/search'},
    'POST /admin/api/unsplash/download': {action: 'unsplash/download'},

    'GET /admin/api/feed/index': {action: 'feed/index'},
    'GET /admin/api/feed/:feedId': {action: 'feed/get'},
    'POST /admin/api/feed/refresh/:feedId': {action: 'feed/refresh'},
    'POST /admin/api/feed/import': {action: 'feed/import'},

    'GET /admin/api/episode/:feedId': {action: 'episode/get'},
    'POST /admin/api/episode/:episodeId': {action: 'episode/check'},
    'POST /admin/api/episode/peaks/:episodeId': {action: 'episode/peaks'},

    'GET /admin/api/job/index': {action: 'job/index'},
    'GET /admin/api/template/:templateId': {action: 'template/get'},
    'GET /admin/api/template/index': {action: 'template/index'},
    'GET /admin/api/template/library': {action: 'template/library'},
    'GET /admin/api/template/reading': {action: 'template/reading'},
    'GET /admin/api/template/fonts': {action: 'template/fonts'},
    'PATCH /admin/api/template/:templateId': {action: 'template/update'},
    'POST /admin/api/template/:templateId/clone': {action: 'template/clone'},
    'POST /admin/api/template': {action: 'template/create'},
    'POST /admin/api/template/:templateId/bookmark': {action: 'template/bookmark'},
    'DELETE /admin/api/template/:templateId': {action: 'template/delete'},
    'GET /admin/api/template/capture/:templateId': {action: 'template/capture'},
    'GET /admin/api/user/current': {action: 'user/current'},
    'GET /admin/api/user/plan': {action: 'user/plan'},
    'POST /admin/api/user/subscribe': {action: 'user/subscribe'},
    'POST /admin/api/user/invite/:clipId?': {action: 'user/invite'},
    'POST /admin/api/user/signature': {action: 'user/signature'},

    //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
    //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
    //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝
    // Note that, in this app, these API endpoints may be accessed using the `Cloud.*()` methods
    // from the Parasails library, or by using those method names as the `action` in <ajax-form>.
    '/api/v1/account/logout': {action: 'account/logout'},
    'PUT   /api/v1/account/update-password': {action: 'account/update-password'},
    'PUT   /api/v1/account/update-profile': {action: 'account/update-profile'},
    'PUT   /api/v1/account/update-billing-card': {action: 'account/update-billing-card'},
    'PUT   /api/v1/entrance/login': {action: 'entrance/login'},
    'POST  /api/v1/entrance/signup': {action: 'entrance/signup'},
    'POST  /api/v1/entrance/send-password-recovery-email': {action: 'entrance/send-password-recovery-email'},
    'POST  /api/v1/entrance/update-password-and-login': {action: 'entrance/update-password-and-login'},
    'POST  /api/v1/deliver-contact-form-message': {action: 'deliver-contact-form-message'}

};
