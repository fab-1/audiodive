/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {

  //'*': ['is-logged-in'],


  'email/view-email-confirm' : 'is-super-admin',
  'email/view-email-invite' : 'is-super-admin',

  'user/index': 'is-super-admin',

  // Bypass the `is-logged-in` policy for:
  'entrance/*': true,
  'view-homepage-or-redirect': true,
  'account/logout': true,
  'deliver-contact-form-message': true,
  'clip/index': true,
  'user/current': true,
  'feed/index': true,
  'preview/preview': true

};
